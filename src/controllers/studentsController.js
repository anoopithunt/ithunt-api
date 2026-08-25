import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { generateToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

/**
 * Helper to generate unique student enrollment number
 */
function generateEnrollmentNumber() {
  const year = new Date().getFullYear();
  const studentCount = db.getCollection('students').length + 1;
  const sequence = String(studentCount).padStart(4, '0');
  return `ITH-${year}-STU${sequence}`;
}

/**
 * Register a new student
 * Creates records in BOTH 'users' (auth) and 'students' (student details) tables
 */
export async function registerStudent(req, res) {
  try {
    const {
      name,
      email,
      password,
      phone,
      course,
      dob,
      gender,
      address,
      guardianName,
      guardianPhone,
      batch,
      bio
    } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email, and password are required fields', 400);
    }

    const lowerEmail = email.toLowerCase();

    // Check if account with email already exists in authentication (users) table
    const existingUser = db.findOne('users', u => u.email.toLowerCase() === lowerEmail);
    if (existingUser) {
      return errorResponse(res, 'An account with this email address already exists in authentication system', 409);
    }

    // Hash password for secure authentication storage
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Insert Authentication record into 'users' table
    const newUser = db.insert('users', {
      name,
      email: lowerEmail,
      password: hashedPassword,
      role: 'student',
      phone: phone || '',
      course: course || '',
      verified: true
    });

    // 2. Insert Student details into distinct 'students' table
    const enrollmentNumber = generateEnrollmentNumber();
    const newStudent = db.insert('students', {
      userId: newUser.id,
      name,
      email: lowerEmail,
      phone: phone || '',
      course: course || '',
      enrollmentNumber,
      dob: dob || '',
      gender: gender || '',
      address: address || '',
      guardianName: guardianName || '',
      guardianPhone: guardianPhone || '',
      batch: batch || `${new Date().getFullYear()}`,
      academicStatus: 'ACTIVE',
      bio: bio || ''
    });

    // Generate JWT token
    const token = generateToken({ id: newUser.id, role: newUser.role, email: newUser.email });
    const { password: _, ...userWithoutPassword } = newUser;

    return successResponse(
      res,
      'Student registered successfully in both authentication and student details records',
      {
        user: userWithoutPassword,
        student: newStudent,
        token
      },
      201
    );
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Login student
 * Authenticates via 'users' table and fetches profile from 'students' table
 */
export async function loginStudent(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required credentials', 400);
    }

    const lowerEmail = email.toLowerCase();

    // 1. Authenticate user from 'users' table
    const user = db.findOne('users', u => u.email.toLowerCase() === lowerEmail);
    if (!user) {
      return errorResponse(res, 'Invalid email or password credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password credentials', 401);
    }

    // 2. Fetch student details from distinct 'students' table
    const student = db.findOne('students', s => s.userId === user.id || s.email.toLowerCase() === lowerEmail);

    const token = generateToken({ id: user.id, role: user.role, email: user.email });
    const { password: _, ...userWithoutPassword } = user;

    return successResponse(res, 'Student login successful', {
      user: userWithoutPassword,
      student: student || null,
      token
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Get authenticated student's profile (from both tables)
 */
export function getStudentProfile(req, res) {
  try {
    const userId = req.user.id;
    const student = db.findOne('students', s => s.userId === userId);

    if (!student) {
      return errorResponse(res, 'Student details profile not found', 404);
    }

    const { password: _, ...userWithoutPassword } = req.user;

    return successResponse(res, 'Student profile fetched successfully', {
      user: userWithoutPassword,
      student
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Update authenticated student's profile in 'students' table
 */
export function updateStudentProfile(req, res) {
  try {
    const userId = req.user.id;
    const student = db.findOne('students', s => s.userId === userId);

    if (!student) {
      return errorResponse(res, 'Student profile record not found', 404);
    }

    const {
      name,
      phone,
      course,
      dob,
      gender,
      address,
      guardianName,
      guardianPhone,
      bio
    } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (course !== undefined) updates.course = course;
    if (dob !== undefined) updates.dob = dob;
    if (gender !== undefined) updates.gender = gender;
    if (address !== undefined) updates.address = address;
    if (guardianName !== undefined) updates.guardianName = guardianName;
    if (guardianPhone !== undefined) updates.guardianPhone = guardianPhone;
    if (bio !== undefined) updates.bio = bio;

    // Update students table
    const updatedStudent = db.updateById('students', student.id, updates);

    // Sync name/phone in users table if updated
    if (name || phone) {
      const userUpdates = {};
      if (name) userUpdates.name = name;
      if (phone) userUpdates.phone = phone;
      db.updateById('users', userId, userUpdates);
    }

    return successResponse(res, 'Student profile updated successfully', {
      student: updatedStudent
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Admin/Faculty: Get all student detail records
 */
export function getAllStudents(req, res) {
  try {
    const { course, batch, status } = req.query;

    let students = db.getCollection('students');

    if (course) {
      students = students.filter(s => s.course.toLowerCase().includes(course.toLowerCase()));
    }
    if (batch) {
      students = students.filter(s => s.batch === batch);
    }
    if (status) {
      students = students.filter(s => s.academicStatus.toLowerCase() === status.toLowerCase());
    }

    return successResponse(res, 'Student details records retrieved successfully', {
      students,
      totalCount: students.length
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Admin/Faculty: Get student by ID or userId
 */
export function getStudentById(req, res) {
  try {
    const { id } = req.params;
    const student = db.findOne('students', s => s.id === id || s.userId === id);

    if (!student) {
      return errorResponse(res, 'Student record not found', 404);
    }

    const user = db.findById('users', student.userId);
    let userWithoutPassword = null;
    if (user) {
      const { password, ...rest } = user;
      userWithoutPassword = rest;
    }

    return successResponse(res, 'Student record fetched successfully', {
      student,
      user: userWithoutPassword
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Admin: Update student record by ID
 */
export function updateStudentById(req, res) {
  try {
    const { id } = req.params;
    const student = db.findOne('students', s => s.id === id || s.userId === id);

    if (!student) {
      return errorResponse(res, 'Student record not found', 404);
    }

    const updatedStudent = db.updateById('students', student.id, req.body);

    if (req.body.name || req.body.phone) {
      const userUpdates = {};
      if (req.body.name) userUpdates.name = req.body.name;
      if (req.body.phone) userUpdates.phone = req.body.phone;
      db.updateById('users', student.userId, userUpdates);
    }

    return successResponse(res, 'Student record updated successfully', {
      student: updatedStudent
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Admin: Delete student from both 'students' and 'users' tables
 */
export function deleteStudent(req, res) {
  try {
    const { id } = req.params;
    const student = db.findOne('students', s => s.id === id || s.userId === id);

    if (!student) {
      return errorResponse(res, 'Student record not found', 404);
    }

    // Delete from students table
    db.deleteById('students', student.id);

    // Delete matching user from authentication (users) table
    if (student.userId) {
      db.deleteById('users', student.userId);
    }

    return successResponse(res, 'Student record and authentication account deleted successfully', {
      deletedStudentId: student.id,
      deletedUserId: student.userId
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}
