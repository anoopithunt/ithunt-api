import { Router } from 'express';
import {
  issueCertificate,
  verifyCertificate,
  getAllCertificates,
  getCertificateById,
  deleteCertificate
} from '../controllers/certificatesController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public Certificate Verification Endpoint
router.get('/verify/:certNo', verifyCertificate);

// Admin & Faculty Certificate Operations
router.get('/', authenticate, getAllCertificates);
router.get('/:id', authenticate, getCertificateById);
router.post('/', authenticate, authorize('admin', 'superadmin', 'faculty'), issueCertificate);
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), deleteCertificate);

export default router;
