import db from '../config/db.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

/**
 * Helper to enrich project with student/author details
 */
function enrichProjectWithStudent(project) {
  if (!project) return null;
  let studentData = null;

  if (project.studentId) {
    studentData = db.findById('students', project.studentId) || 
                  db.findOne('students', s => s.userId === project.studentId || s.enrollmentNumber === project.studentId);
  }

  return {
    ...project,
    studentDetails: studentData ? {
      id: studentData.id,
      name: studentData.name,
      enrollmentNumber: studentData.enrollmentNumber,
      course: studentData.course,
      batch: studentData.batch
    } : null
  };
}

/**
 * Get all projects with filtering and search
 */
export function getAllProjects(req, res) {
  try {
    const { category, tech, featured, studentId, status, search } = req.query;
    let projects = db.getCollection('projects');

    if (category) {
      projects = projects.filter(p => p.category && p.category.toLowerCase().includes(category.toLowerCase()));
    }

    if (tech) {
      const techLower = tech.toLowerCase();
      projects = projects.filter(p => Array.isArray(p.techStack) && p.techStack.some(t => t.toLowerCase().includes(techLower)));
    }

    if (featured !== undefined) {
      const isFeatured = featured === 'true' || featured === true;
      projects = projects.filter(p => Boolean(p.featured) === isFeatured);
    }

    if (studentId) {
      projects = projects.filter(p => p.studentId === studentId);
    }

    if (status) {
      projects = projects.filter(p => p.status && p.status.toLowerCase() === status.toLowerCase());
    }

    if (search) {
      const term = search.toLowerCase();
      projects = projects.filter(p =>
        (p.title && p.title.toLowerCase().includes(term)) ||
        (p.description && p.description.toLowerCase().includes(term)) ||
        (p.authorName && p.authorName.toLowerCase().includes(term)) ||
        (p.guideName && p.guideName.toLowerCase().includes(term))
      );
    }

    const enriched = projects.map(enrichProjectWithStudent);

    return successResponse(res, 'Projects retrieved successfully', {
      projects: enriched,
      totalCount: enriched.length
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Get project by ID or Slug
 */
export function getProjectById(req, res) {
  try {
    const { id } = req.params;
    const project = db.findById('projects', id) || db.findOne('projects', p => p.slug === id || p.title.toLowerCase().replace(/\s+/g, '-') === id);

    if (!project) {
      return errorResponse(res, 'Project not found', 404);
    }

    return successResponse(res, 'Project details retrieved successfully', {
      project: enrichProjectWithStudent(project)
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Create a new Project (Admin/Faculty/Staff)
 */
export function createProject(req, res) {
  try {
    const {
      title,
      category,
      description,
      techStack,
      githubUrl,
      liveUrl,
      thumbnail,
      studentId,
      authorName,
      authorEmail,
      guideName,
      academicYear,
      featured,
      status
    } = req.body;

    if (!title || !category || !description) {
      return errorResponse(res, 'Project title, category, and description are required', 400);
    }

    let linkedStudent = null;
    if (studentId) {
      linkedStudent = db.findById('students', studentId) || db.findOne('students', s => s.userId === studentId || s.enrollmentNumber === studentId);
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newProject = db.insert('projects', {
      title,
      slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      description,
      techStack: Array.isArray(techStack) ? techStack : (techStack ? techStack.split(',').map(s => s.trim()) : ['Full Stack']),
      githubUrl: githubUrl || '',
      liveUrl: liveUrl || '',
      thumbnail: thumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60',
      studentId: linkedStudent ? linkedStudent.id : (studentId || null),
      authorName: authorName || (linkedStudent ? linkedStudent.name : 'IT HUNT Student Innovator'),
      authorEmail: authorEmail || (linkedStudent ? linkedStudent.email : ''),
      guideName: guideName || 'Mr. Lakshman Singh Chauhan',
      academicYear: academicYear || '2025-2026',
      featured: Boolean(featured),
      status: status || 'APPROVED',
      createdAt: new Date().toISOString()
    });

    return successResponse(res, 'Project created and synced to Firebase Realtime DB & Firestore', {
      project: enrichProjectWithStudent(newProject)
    }, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Public / Student Submission for NIELIT or Internship Capstone Projects
 */
export function submitStudentProject(req, res) {
  try {
    const {
      title,
      category,
      description,
      techStack,
      githubUrl,
      liveUrl,
      authorName,
      authorEmail,
      enrollmentNumber,
      studentPhone
    } = req.body;

    if (!title || !authorName || !category) {
      return errorResponse(res, 'Title, Author name, and Category are required for project submission', 400);
    }

    let linkedStudent = null;
    if (enrollmentNumber) {
      linkedStudent = db.findOne('students', s => s.enrollmentNumber === enrollmentNumber);
    } else if (authorEmail) {
      linkedStudent = db.findOne('students', s => s.email.toLowerCase() === authorEmail.toLowerCase());
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const submission = db.insert('projects', {
      title,
      slug: `${slug}-${Math.floor(1000 + Math.random() * 9000)}`,
      category: category || "NIELIT 'O' Level Major Project",
      description: description || 'Student capstone software submission.',
      techStack: Array.isArray(techStack) ? techStack : (techStack ? techStack.split(',').map(s => s.trim()) : ['HTML', 'CSS', 'JavaScript']),
      githubUrl: githubUrl || '',
      liveUrl: liveUrl || '',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60',
      studentId: linkedStudent ? linkedStudent.id : null,
      authorName,
      authorEmail: authorEmail || (linkedStudent ? linkedStudent.email : ''),
      studentPhone: studentPhone || (linkedStudent ? linkedStudent.phone : ''),
      guideName: 'Mr. Lakshman Singh Chauhan',
      academicYear: '2025-2026',
      featured: false,
      status: 'UNDER_REVIEW',
      createdAt: new Date().toISOString()
    });

    return successResponse(res, 'Student project submitted successfully for review and saved to Firebase', {
      submission: enrichProjectWithStudent(submission)
    }, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Update an existing project
 */
export function updateProject(req, res) {
  try {
    const { id } = req.params;
    const existing = db.findById('projects', id) || 
                     db.findOne('projects', p => p.slug === id || p.title.toLowerCase().replace(/\s+/g, '-') === id);

    if (!existing) {
      return errorResponse(res, 'Project not found', 404);
    }

    const updates = { ...req.body };
    if (updates.techStack && typeof updates.techStack === 'string') {
      updates.techStack = updates.techStack.split(',').map(s => s.trim());
    }

    if (updates.studentId) {
      const student = db.findById('students', updates.studentId) || db.findOne('students', s => s.userId === updates.studentId || s.enrollmentNumber === updates.studentId);
      if (student) {
        updates.studentId = student.id;
        updates.authorName = updates.authorName || student.name;
        updates.authorEmail = updates.authorEmail || student.email;
      }
    }

    const updated = db.updateById('projects', existing.id, updates);

    return successResponse(res, 'Project updated successfully and synced to Firebase', {
      project: enrichProjectWithStudent(updated)
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Fast status update shortcut (Approve / Reject / Feature)
 */
export function updateProjectStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, featured } = req.body;

    const existing = db.findById('projects', id) || 
                     db.findOne('projects', p => p.slug === id || p.title.toLowerCase().replace(/\s+/g, '-') === id);

    if (!existing) {
      return errorResponse(res, 'Project not found', 404);
    }

    const updates = {};
    if (status) updates.status = status.toUpperCase();
    if (featured !== undefined) updates.featured = Boolean(featured);

    const updated = db.updateById('projects', existing.id, updates);

    return successResponse(res, `Project status updated to ${updated.status} and synced to Firebase`, {
      project: enrichProjectWithStudent(updated)
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Delete a project
 */
export function deleteProject(req, res) {
  try {
    const { id } = req.params;
    const existing = db.findById('projects', id) || 
                     db.findOne('projects', p => p.slug === id || p.title.toLowerCase().replace(/\s+/g, '-') === id);

    if (!existing) {
      return errorResponse(res, 'Project not found', 404);
    }

    db.deleteById('projects', existing.id);

    return successResponse(res, 'Project deleted successfully from database & Firebase Realtime DB / Firestore', {
      deletedProjectId: existing.id,
      title: existing.title
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

/**
 * Get all projects submitted by a specific student
 */
export function getProjectsByStudent(req, res) {
  try {
    const { studentId } = req.params;
    const projects = db.getCollection('projects').filter(p => 
      p.studentId === studentId || 
      (p.studentDetails && p.studentDetails.id === studentId) ||
      (p.authorEmail && p.authorEmail.toLowerCase() === studentId.toLowerCase())
    );

    return successResponse(res, 'Student projects retrieved', {
      studentId,
      projects: projects.map(enrichProjectWithStudent),
      totalCount: projects.length
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}
