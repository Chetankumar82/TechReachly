import { OutreachLog } from '../models/OutreachLog.js';
import { Campaign } from '../models/Campaign.js';

// Base64 encoded 1x1 transparent GIF (43 bytes)
const TRANSPARENT_1PX_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/**
 * Sends the 1x1 tracking pixel response with strict no-cache headers
 */
const sendPixelResponse = (res) => {
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': TRANSPARENT_1PX_GIF.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private, post-check=0, pre-check=0',
    'Pragma': 'no-cache',
    'Expires': '0',
  });
  res.end(TRANSPARENT_1PX_GIF);
};

// @route   GET /api/track/open/:logId/:step?
// Public route (fetched automatically by email clients when email is opened)
export const trackEmailOpen = async (req, res) => {
  try {
    const { logId, step } = req.params;

    if (!logId || !logId.match(/^[0-9a-fA-F]{24}$/)) {
      return sendPixelResponse(res);
    }

    const log = await OutreachLog.findById(logId);
    if (!log) {
      return sendPixelResponse(res);
    }

    const now = new Date();
    log.openedAt = log.openedAt || now;
    log.openCount = (log.openCount || 0) + 1;

    // Advance status to 'opened' if not already replied
    if (log.status === 'sent' || log.status === 'scheduled') {
      log.status = 'opened';
    }

    // Record open event on specific step in history if present
    if (step && log.history && log.history.length > 0) {
      const stepNum = Number(step);
      const stepRecord = log.history.find((h) => h.step === stepNum);
      if (stepRecord) {
        stepRecord.openedAt = stepRecord.openedAt || now;
        stepRecord.openCount = (stepRecord.openCount || 0) + 1;
      }
    }

    await log.save();

    // Update campaign level unique open statistics
    if (log.campaignId) {
      const uniqueOpens = await OutreachLog.countDocuments({
        campaignId: log.campaignId,
        $or: [
          { status: 'opened' },
          { openCount: { $gt: 0 } },
          { openedAt: { $exists: true, $ne: null } },
        ],
      });

      await Campaign.findByIdAndUpdate(log.campaignId, {
        'stats.opened': uniqueOpens,
      });
    }

    console.log(`[Tracking] Read receipt: Log ${logId} (Step ${step || 1}) opened (Count: ${log.openCount})`);
  } catch (error) {
    console.error('[Tracking Error]:', error.message);
  }

  // Always return the pixel even if DB operation fails
  return sendPixelResponse(res);
};

// @route   GET /api/track/test-open
export const trackTestEmailOpen = async (req, res) => {
  const recipient = req.query.recipient || 'Test Candidate';
  console.log(`[Tracking] Test preview email opened by: ${recipient}`);
  return sendPixelResponse(res);
};
