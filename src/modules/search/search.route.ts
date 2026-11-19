import { Router } from 'express';
import { SearchController } from './search.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = Router();

// protect global search with admin auth
router.use(protect);

router.get('/', SearchController.globalSearch);

export const SearchRoutes = router;

