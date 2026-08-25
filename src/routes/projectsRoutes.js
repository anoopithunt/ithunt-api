import { Router } from 'express';
import {
  getAllProjects,
  getProjectById,
  getProjectsByStudent,
  createProject,
  submitStudentProject,
  updateProject,
  deleteProject
} from '../controllers/projectsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public Discovery & Student Submission Routes
router.get('/', getAllProjects);
router.get('/student/:studentId', getProjectsByStudent);
router.get('/:id', getProjectById);
router.post('/submit', submitStudentProject);

// Protected Admin / Faculty Routes
router.post('/', authenticate, authorize('admin', 'superadmin', 'faculty'), createProject);
router.put('/:id', authenticate, authorize('admin', 'superadmin', 'faculty'), updateProject);
router.patch('/:id', authenticate, authorize('admin', 'superadmin', 'faculty'), updateProject);
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), deleteProject);

export default router;
