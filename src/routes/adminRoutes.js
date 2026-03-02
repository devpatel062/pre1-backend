import { Router } from 'express';
import { dashboard, listResults } from '../controllers/adminController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/dashboard', protect, requireRole('admin', 'superuser'), dashboard);
router.get('/results', protect, requireRole('admin', 'superuser'), listResults);

export default router;
