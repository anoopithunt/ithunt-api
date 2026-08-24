import { Router } from 'express';
import { register, login, getCurrentUser, getAllUsers, deleteUser } from '../controllers/authController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getCurrentUser);
router.get('/users', authenticate, authorize('admin', 'superadmin'), getAllUsers);
router.get('/', authenticate, authorize('admin', 'superadmin'), getAllUsers);

// Delete User endpoints
router.delete('/users/:id', authenticate, authorize('admin', 'superadmin'), deleteUser);
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), deleteUser);

export default router;
