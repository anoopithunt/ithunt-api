import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  getProjectsByStudent,
  createProject,
  submitStudentProject,
  updateProject,
  updateProjectStatus,
  deleteProject
} from '../controllers/projectsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public Discovery & Student Submission Routes
router.get('/', getAllProjects);
router.get('/student/:studentId', getProjectsByStudent);
router.get('/:id', getProjectById);
router.post('/submit', submitStudentProject);

// Protected Admin / Faculty Routes (Create, Full Update, Status Update, Delete)
router.post('/', authenticate, authorize('admin', 'superadmin', 'faculty'), createProject);
router.put('/:id', authenticate, authorize('admin', 'superadmin', 'faculty'), updateProject);
router.patch('/:id', authenticate, authorize('admin', 'superadmin', 'faculty'), updateProject);
router.patch('/:id/status', authenticate, authorize('admin', 'superadmin', 'faculty'), updateProjectStatus);
router.put('/:id/status', authenticate, authorize('admin', 'superadmin', 'faculty'), updateProjectStatus);
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), deleteProject);

export default router;
