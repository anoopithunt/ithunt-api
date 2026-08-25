import { Router } from 'express';
import {
  registerStudent,
  loginStudent,
  getStudentProfile,
  updateStudentProfile,
  getAllStudents,
  getStudentById,
  updateStudentById,
  deleteStudent
} from '../controllers/studentsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Student Authentication & Registration
router.post('/register', registerStudent);
router.post('/login', loginStudent);

// Student Self Profile Routes
router.get('/me', authenticate, getStudentProfile);
router.put('/me', authenticate, updateStudentProfile);

// Admin & Faculty Management Routes
router.get('/', authenticate, authorize('admin', 'superadmin', 'faculty'), getAllStudents);
router.get('/:id', authenticate, getStudentById);
router.put('/:id', authenticate, authorize('admin', 'superadmin'), updateStudentById);
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), deleteStudent);

export default router;
