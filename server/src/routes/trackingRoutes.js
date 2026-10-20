import express from 'express';
import { trackEmailOpen, trackTestEmailOpen } from '../controllers/trackingController.js';

const router = express.Router();

// Public open-tracking endpoints (fetched by email clients without auth)
router.get('/open/:logId/:step?', trackEmailOpen);
router.get('/test-open', trackTestEmailOpen);

export default router;
