import db from '../config/db.js';
import { successResponse, errorResponse } from '../utils/helpers.js';

export function submitNielitProject(req, res) {
  try {
    const { studentName, regNo, projectTitle, level, guideName, githubRepo, status } = req.body;

    if (!studentName || !regNo || !projectTitle) {
      return errorResponse(res, 'Student name, registration number, and project title are required', 400);
    }

    const project = db.insert('nielitProjects', {
      studentName,
      regNo,
      projectTitle,
      level: level || 'O Level',
      guideName: guideName || 'Mr. Lakshman Singh Chauhan',
      githubRepo: githubRepo || '',
      status: status || 'SUBMITTED',
      createdAt: new Date().toISOString()
    });

    return successResponse(res, 'NIELIT Project record submitted successfully', { project }, 201);
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

export function getAllNielitProjects(req, res) {
  try {
    const { status, level, search } = req.query;
    let projects = db.getCollection('nielitProjects');

    if (status) {
      projects = projects.filter(p => p.status && p.status.toLowerCase() === status.toLowerCase());
    }

    if (level) {
      projects = projects.filter(p => p.level && p.level.toLowerCase().includes(level.toLowerCase()));
    }

    if (search) {
      const term = search.toLowerCase();
      projects = projects.filter(p =>
        (p.studentName && p.studentName.toLowerCase().includes(term)) ||
        (p.regNo && p.regNo.toLowerCase().includes(term)) ||
        (p.projectTitle && p.projectTitle.toLowerCase().includes(term)) ||
        (p.guideName && p.guideName.toLowerCase().includes(term))
      );
    }

    return successResponse(res, 'NIELIT Projects list retrieved', { projects, totalCount: projects.length });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

export function getNielitProjectById(req, res) {
  try {
    const { id } = req.params;
    const project = db.findById('nielitProjects', id) || db.findOne('nielitProjects', p => p.regNo === id || p.id === id);

    if (!project) {
      return errorResponse(res, 'NIELIT Project record not found', 404);
    }

    return successResponse(res, 'NIELIT Project details retrieved', { project });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

export function updateNielitProject(req, res) {
  try {
    const { id } = req.params;
    const project = db.findById('nielitProjects', id) || db.findOne('nielitProjects', p => p.regNo === id || p.id === id);

    if (!project) {
      return errorResponse(res, 'NIELIT Project record not found', 404);
    }

    const updates = { ...req.body };
    const updated = db.updateById('nielitProjects', project.id, updates);

    return successResponse(res, 'NIELIT Project form updated successfully and synced to Firebase', {
      project: updated
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

export function updateNielitProjectStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status) {
      return errorResponse(res, 'Status is required', 400);
    }

    const project = db.findById('nielitProjects', id) || db.findOne('nielitProjects', p => p.regNo === id || p.id === id);
    if (!project) {
      return errorResponse(res, 'NIELIT Project record not found', 404);
    }

    const updated = db.updateById('nielitProjects', project.id, { status: status.toUpperCase(), remarks: remarks || '' });

    return successResponse(res, 'NIELIT project status updated successfully and synced to Firebase', { project: updated });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}

export function deleteNielitProject(req, res) {
  try {
    const { id } = req.params;
    const project = db.findById('nielitProjects', id) || db.findOne('nielitProjects', p => p.regNo === id || p.id === id);

    if (!project) {
      return errorResponse(res, 'NIELIT Project record not found', 404);
    }

    db.deleteById('nielitProjects', project.id);

    return successResponse(res, 'Submitted NIELIT project form deleted successfully from database & Firebase', {
      deletedProjectId: project.id,
      regNo: project.regNo,
      projectTitle: project.projectTitle
    });
  } catch (error) {
    return errorResponse(res, error.message, 500);
  }
}
