import express from 'express';
import { register, login, getMe, updateSmtpSettings, testSmtp, testGemini, auditDeliverability, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/smtp', protect, updateSmtpSettings);
router.post('/smtp/test', protect, testSmtp);
router.post('/smtp/audit', protect, auditDeliverability);
router.post('/gemini/test', protect, testGemini);

export default router;
