import { Router } from 'express';
import {
  getDashboardStats,
  getFirebaseCollectionData,
  getFirebaseDocumentData,
  getFirebaseStorageFiles,
  getRealtimeDBData
} from '../controllers/adminController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Executive Dashboard Stats
router.get('/stats', authenticate, authorize('admin', 'superadmin'), getDashboardStats);

// Fetch Firebase Collections & Documents
router.get('/firebase/collections/:collection', authenticate, authorize('admin', 'superadmin'), getFirebaseCollectionData);
router.get('/firebase/collections/:collection/:id', authenticate, authorize('admin', 'superadmin'), getFirebaseDocumentData);

// Fetch Firebase Realtime DB & Storage Files
router.get('/firebase/realtime', authenticate, authorize('admin', 'superadmin'), getRealtimeDBData);
router.get('/firebase/storage/files', authenticate, authorize('admin', 'superadmin'), getFirebaseStorageFiles);

export default router;
