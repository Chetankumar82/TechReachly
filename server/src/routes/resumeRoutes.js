import express from 'express';
import { uploadAndParseResume, getResume, updateResume, deleteResume } from '../controllers/resumeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/upload', uploadResume.single('resume'), uploadAndParseResume);
router.get('/', getResume);
router.put('/', updateResume);
router.delete('/', deleteResume);

export default router;
