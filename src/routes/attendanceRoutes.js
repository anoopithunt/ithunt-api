import { Router } from 'express';
import {
  markAttendance,
  getStudentAttendance,
  getBatchAttendance
} from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/mark', authenticate, authorize('faculty', 'admin', 'superadmin'), markAttendance);
router.get('/student/:studentId', authenticate, getStudentAttendance);
router.get('/batch', authenticate, authorize('faculty', 'admin', 'superadmin'), getBatchAttendance);

export default router;
