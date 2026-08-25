import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { generateToken } from '../utils/jwt.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export async function register(req, res) {
  try {
    const { name, email, password, role, phone, course, bio } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 'Name, email, and password are required fields', 400);
    }

    const lowerEmail = email.toLowerCase();
    const existingUser = db.findOne('users', u => u.email.toLowerCase() === lowerEmail);
    if (existingUser) {
      return errorResponse(res, 'An account with this email address already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = (role && ['student', 'faculty'].includes(role)) ? role : 'student';

    const newUser = db.insert('users', {
      name,
      email: lowerEmail,
      password: hashedPassword,
      role: assignedRole,
      phone: phone || '',
      course: course || '',
      bio: bio || '',
      verified: true
    });

    let studentRecord = null;
    if (assignedRole === 'student') {
      const year = new Date().getFullYear();
      const studentCount = db.getCollection('students').length + 1;
      const enrollmentNumber = `ITH-${year}-STU${String(studentCount).padStart(4, '0')}`;

      studentRecord = db.insert('students', {
        userId: newUser.id,
        name,
        email: lowerEmail,
        phone: phone || '',
        course: course || '',
        enrollmentNumber,
        dob: req.body.dob || '',
        gender: req.body.gender || '',
        address: req.body.address || '',
        guardianName: req.body.guardianName || '',
        guardianPhone: req.body.guardianPhone || '',
        batch: req.body.batch || `${year}`,
        academicStatus: 'ACTIVE',
        bio: bio || ''
      });
    }

    const token = generateToken({ id: newUser.id, role: newUser.role, email: newUser.email });
    const { password: _, ...userWithoutPassword } = newUser;

    return successResponse(res, 'User registered successfully', {
      user: userWithoutPassword,
      student: studentRecord,
      token
    }, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 'Email and password are required', 400);
    }

    const lowerEmail = email.toLowerCase();
    const user = db.findOne('users', u => u.email.toLowerCase() === lowerEmail);
    if (!user) {
      return errorResponse(res, 'Invalid email or password credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password credentials', 401);
    }

    const studentRecord = db.findOne('students', s => s.userId === user.id || s.email.toLowerCase() === lowerEmail);

    const token = generateToken({ id: user.id, role: user.role, email: user.email });
    const { password: _, ...userWithoutPassword } = user;

    return successResponse(res, 'Authentication successful', {
      user: userWithoutPassword,
      student: studentRecord || null,
      token
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

export function getCurrentUser(req, res) {
  const { password: _, ...userWithoutPassword } = req.user;
  return successResponse(res, 'Current user profile fetched successfully', {
    user: userWithoutPassword
  });
}

export function getAllUsers(req, res) {
  const users = db.getCollection('users').map(u => {
    const { password, ...rest } = u;
    return rest;
  });
  return successResponse(res, 'Registered users fetched successfully', { users, count: users.length });
}

export function deleteUser(req, res) {
  try {
    const { id } = req.params;
    
    const targetUser = db.findById('users', id);
    if (!targetUser) {
      return errorResponse(res, 'User record not found', 404);
    }

    // Protect superadmin from unauthorized deletion
    if (targetUser.role === 'superadmin' && req.user.id !== targetUser.id) {
      return errorResponse(res, 'Superadmin accounts cannot be deleted by other users', 403);
    }

    const deleted = db.deleteById('users', id);
    if (!deleted) {
      return errorResponse(res, 'User record could not be deleted', 500);
    }

    return successResponse(res, `User account (${targetUser.email}) deleted successfully`, {
      deletedUserId: id
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}
