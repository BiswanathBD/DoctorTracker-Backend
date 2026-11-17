import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { upload } from '../../utils/fileUploader.js';

const router = Router();

// auth routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/me', protect, AuthController.getMe);
router.patch('/avatar', protect, upload.single('avatar'), AuthController.updateAvatar);

export const AuthRoutes = router;
