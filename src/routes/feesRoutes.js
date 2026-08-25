import { Router } from 'express';
import {
  recordFeePayment,
  getStudentFeeLedger,
  getAllFeesTransactions
} from '../controllers/feesController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/record', authenticate, authorize('admin', 'superadmin'), recordFeePayment);
router.get('/student/:studentId', authenticate, getStudentFeeLedger);
router.get('/', authenticate, authorize('admin', 'superadmin'), getAllFeesTransactions);

export default router;
