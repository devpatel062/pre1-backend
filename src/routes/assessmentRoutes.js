import { Router } from 'express';
import {
  checkStatus,
  getAttemptPage,
  getResult,
  saveAnswer,
  startAssessment,
  submitAssessment
} from '../controllers/assessmentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/status', protect, checkStatus);
router.post('/start', protect, startAssessment);
router.get('/attempt/:attemptId/page', protect, getAttemptPage);
router.put('/attempt/:attemptId/answer', protect, saveAnswer);
router.post('/attempt/:attemptId/submit', protect, submitAssessment);
router.get('/result/:attemptId', protect, getResult);

export default router;
