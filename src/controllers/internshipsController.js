import db from '../config/db.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

/**
 * Get all available internship programs
 */
export function getAllInternships(req, res) {
  try {
    const internships = db.getCollection('internships');
    return successResponse(res, 'Internship tracks fetched successfully', {
      internships,
      count: internships.length
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Create new internship track (Admin)
 */
export function createInternship(req, res) {
  try {
    const { title, duration, stipend, mode, skills, description } = req.body;
    if (!title || !duration) {
      return errorResponse(res, 'Title and duration are required fields', 400);
    }

    const internship = db.insert('internships', {
      title,
      duration,
      stipend: stipend || 'Performance Based',
      mode: mode || 'Hybrid',
      skills: Array.isArray(skills) ? skills : (skills ? [skills] : []),
      description: description || '',
      status: 'OPEN'
    });

    return successResponse(res, 'Internship track created successfully', { internship }, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Submit internship application
 */
export function applyForInternship(req, res) {
  try {
    const {
      internshipId,
      internshipTitle,
      candidateName,
      email,
      phone,
      college,
      githubUrl,
      resumeUrl,
      coverNote
    } = req.body;

    if (!candidateName || !email || !phone) {
      return errorResponse(res, 'Candidate name, email, and phone are required', 400);
    }

    const application = db.insert('internshipApplications', {
      internshipId: internshipId || '',
      internshipTitle: internshipTitle || 'Software Developer Internship',
      candidateName,
      email: email.toLowerCase(),
      phone,
      college: college || '',
      githubUrl: githubUrl || '',
      resumeUrl: resumeUrl || '',
      coverNote: coverNote || '',
      status: 'PENDING_REVIEW',
      appliedAt: new Date().toISOString()
    });

    return successResponse(res, 'Internship application submitted successfully', { application }, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Get all internship applications (Admin)
 */
export function getInternshipApplications(req, res) {
  try {
    const applications = db.getCollection('internshipApplications');
    return successResponse(res, 'Internship applications retrieved', {
      applications,
      count: applications.length
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Update application status (Admin)
 */
export function updateApplicationStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const updated = db.updateById('internshipApplications', id, {
      status,
      remarks: remarks || '',
      reviewedAt: new Date().toISOString()
    });

    if (!updated) {
      return errorResponse(res, 'Application not found', 404);
    }

    return successResponse(res, 'Application status updated', { application: updated });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}
