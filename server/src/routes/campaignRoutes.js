import express from 'express';
import {
  generateAiPitches,
  generateSubjectLinesController,
  createCampaign,
  getCampaigns,
  getCampaignById,
  toggleCampaignStatus,
  retryCampaign,
  deleteCampaign,
  duplicateCampaign,
  sendTestEmail,
  analyzeJdMatch,
  markLogReplied,
  undoLogReplied,
} from '../controllers/campaignController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/generate-pitch', generateAiPitches);
router.post('/generate-subject-lines', generateSubjectLinesController);
router.post('/match-score', analyzeJdMatch);
router.post('/send-test-email', sendTestEmail);
router.post('/logs/:logId/reply', markLogReplied);
router.post('/logs/:logId/unreply', undoLogReplied);
router.post('/', createCampaign);
router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.patch('/:id/status', toggleCampaignStatus);
router.post('/:id/retry', retryCampaign);
router.post('/:id/duplicate', duplicateCampaign);
router.delete('/:id', deleteCampaign);

export default router;
