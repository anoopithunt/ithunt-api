import { Router } from 'express';
import {
  submitNielitProject,
  getAllNielitProjects,
  getNielitProjectById,
  updateNielitProject,
  updateNielitProjectStatus,
  deleteNielitProject
} from '../controllers/nielitController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public submission and list
router.post('/', submitNielitProject);
router.get('/', getAllNielitProjects);
router.get('/:id', getNielitProjectById);

// Protected Admin / Faculty routes
router.put('/:id', authenticate, authorize('admin', 'superadmin', 'faculty'), updateNielitProject);
router.patch('/:id', authenticate, authorize('admin', 'superadmin', 'faculty'), updateNielitProject);
router.patch('/:id/status', authenticate, authorize('admin', 'superadmin', 'faculty'), updateNielitProjectStatus);
router.put('/:id/status', authenticate, authorize('admin', 'superadmin', 'faculty'), updateNielitProjectStatus);
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), deleteNielitProject);

export default router;
