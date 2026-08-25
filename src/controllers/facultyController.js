import db from '../config/db.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

/**
 * Add / Register a Faculty Member
 */
export function addFacultyMember(req, res) {
  try {
    const {
      name,
      email,
      phone,
      designation,
      qualification,
      specialization,
      assignedCourses,
      experienceYears,
      bio
    } = req.body;

    if (!name || !email) {
      return errorResponse(res, 'Name and email are required fields', 400);
    }

    const existing = db.findOne('faculty', f => f.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return errorResponse(res, 'Faculty member with this email already exists', 409);
    }

    const faculty = db.insert('faculty', {
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      designation: designation || 'Lead Instructor & Mentor',
      qualification: qualification || 'B.Tech / MCA / NIELIT A Level',
      specialization: specialization || 'Full Stack & Software Engineering',
      assignedCourses: assignedCourses || ['NIELIT O Level', 'MERN Stack'],
      experienceYears: experienceYears || '3+ Years',
      status: 'ACTIVE',
      bio: bio || ''
    });

    return successResponse(res, 'Faculty member registered successfully', { faculty }, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Get all faculty members
 */
export function getAllFaculty(req, res) {
  try {
    const faculty = db.getCollection('faculty');
    return successResponse(res, 'Faculty list retrieved successfully', { faculty, count: faculty.length });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Get faculty member by ID
 */
export function getFacultyById(req, res) {
  try {
    const { id } = req.params;
    const member = db.findById('faculty', id);
    if (!member) {
      return errorResponse(res, 'Faculty member not found', 404);
    }
    return successResponse(res, 'Faculty details retrieved', { faculty: member });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Update faculty member details
 */
export function updateFaculty(req, res) {
  try {
    const { id } = req.params;
    const updated = db.updateById('faculty', id, req.body);
    if (!updated) {
      return errorResponse(res, 'Faculty member not found', 404);
    }
    return successResponse(res, 'Faculty details updated successfully', { faculty: updated });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Delete faculty member
 */
export function deleteFaculty(req, res) {
  try {
    const { id } = req.params;
    const deleted = db.deleteById('faculty', id);
    if (!deleted) {
      return errorResponse(res, 'Faculty member not found', 404);
    }
    return successResponse(res, 'Faculty member removed successfully');
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}
