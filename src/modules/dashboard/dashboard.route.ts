import { Router } from 'express';
import { DashboardController } from './dashboard.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

// protect dashboard stats with admin auth
router.use(protect);

router.get('/stats', DashboardController.getDashboardStats);

export const DashboardRoutes = router;
