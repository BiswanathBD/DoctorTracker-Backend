import { Router } from 'express';
import { login, getMe, register } from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
const router = Router();
// public auth routes
router.post('/login', login);
router.post('/register', register);
// protected auth routes
router.get('/me', protect, getMe);
export const authRouter = router;
