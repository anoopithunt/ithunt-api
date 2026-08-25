import { Router } from 'express';
import {
  addFacultyMember,
  getAllFaculty,
  getFacultyById,
  updateFaculty,
  deleteFaculty
} from '../controllers/facultyController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public Faculty Directory
router.get('/', getAllFaculty);
router.get('/:id', getFacultyById);

// Admin Operations
router.post('/', authenticate, authorize('admin', 'superadmin'), addFacultyMember);
router.put('/:id', authenticate, authorize('admin', 'superadmin'), updateFaculty);
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), deleteFaculty);

export default router;
