import { Router } from 'express';
import {
  createAdmission,
  getAllAdmissions,
  getAdmissionById,
  getRegistrationSlipById,
  updateAdmissionStatus,
  deleteAdmission
} from '../controllers/admissionsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public route for online admission submission
router.post('/', createAdmission);

// Authenticated staff/admin routes
router.get('/', authenticate, authorize('admin', 'superadmin', 'faculty'), getAllAdmissions);
router.get('/:id', getAdmissionById);
router.get('/:id/slip', getRegistrationSlipById);
router.patch('/:id/status', authenticate, authorize('admin', 'superadmin'), updateAdmissionStatus);
router.put('/:id/status', authenticate, authorize('admin', 'superadmin'), updateAdmissionStatus);

// Delete Admission endpoint (Admin / SuperAdmin)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), deleteAdmission);

export default router;
