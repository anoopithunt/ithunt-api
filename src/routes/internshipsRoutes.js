import { Router } from 'express';
import {
  getAllInternships,
  createInternship,
  applyForInternship,
  getInternshipApplications,
  updateApplicationStatus
} from '../controllers/internshipsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public Internship tracks & applications
router.get('/', getAllInternships);
router.post('/apply', applyForInternship);

// Admin operations
router.post('/', authenticate, authorize('admin', 'superadmin'), createInternship);
router.get('/applications', authenticate, authorize('admin', 'superadmin'), getInternshipApplications);
router.put('/applications/:id/status', authenticate, authorize('admin', 'superadmin'), updateApplicationStatus);

export default router;
