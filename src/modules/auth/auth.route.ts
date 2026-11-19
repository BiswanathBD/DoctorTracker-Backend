import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import { upload } from '../../utils/fileUploader.js';

const router = Router();

// auth routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', protect, AuthController.getMe);
router.patch('/avatar', protect, upload.single('avatar'), AuthController.updateAvatar);
router.delete('/avatar', protect, AuthController.deleteAvatar);

export const AuthRoutes = router;
