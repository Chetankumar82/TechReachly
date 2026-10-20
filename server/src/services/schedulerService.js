import cron from 'node-cron';
import { OutreachLog } from '../models/OutreachLog.js';
import { Campaign } from '../models/Campaign.js';
import { User } from '../models/User.js';
import { HRContact } from '../models/HRContact.js';
import { Resume } from '../models/Resume.js';
import { sendOutreachEmail } from './mailerService.js';

let isJobRunning = false;

/**
 * Checks how many emails a user has sent in the last 24 hours
 */
const getUserSentCountLast24Hours = async (userId) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const logs = await OutreachLog.find({
    userId,
    'history.sentAt': { $gte: oneDayAgo },
  });

  return logs.reduce((acc, log) => {
    const recentSends = log.history.filter((h) => h.sentAt >= oneDayAgo);
    return acc + recentSends.length;
  }, 0);
};

/**
 * Core dispatch cycle: processes scheduled outreach emails with pacing & anti-spam controls
 */
export const processPendingOutreach = async () => {
  if (isJobRunning) return;
  isJobRunning = true;

  try {
    const now = new Date();

    // Find up to 5 scheduled outreach logs ready for dispatch
    const pendingLogs = await OutreachLog.find({
      status: 'scheduled',
      nextSendAt: { $lte: now },
    })
      .populate('campaignId')
      .populate('hrContactId')
      .populate('userId')
      .limit(5);

    for (const log of pendingLogs) {
      const campaign = log.campaignId;
      const user = log.userId;
      const hr = log.hrContactId;

      // Skip if campaign is paused or completed
      if (!campaign || campaign.status !== 'active') {
        continue;
      }

      // If HR contact was deleted, clean up orphaned log
      if (!hr) {
        console.warn(`[Scheduler] HR contact deleted for log ${log._id}. Cleaning up.`);
        await OutreachLog.deleteOne({ _id: log._id });
        continue;
      }

      // Skip if user does not have active SMTP configured
      if (!user.smtpConfig || !user.smtpConfig.authUser || !user.smtpConfig.authPass) {
        log.status = 'paused';
        log.stopReason = 'SMTP credentials not configured';
        await log.save();
        continue;
      }

      // Check daily rate limits
      const dailyLimit = user.outreachSettings?.dailyLimit || 25;
      const sentCountToday = await getUserSentCountLast24Hours(user._id);

      if (sentCountToday >= dailyLimit) {
        console.log(`[Scheduler] User ${user.email} reached daily limit (${dailyLimit}). Rescheduling.`);
        // Reschedule to tomorrow at 9:30 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 30, 0, 0);
        log.nextSendAt = tomorrow;
        await log.save();
        continue;
      }

      // Determine content based on current step
      let subject = '';
      let body = '';
      const step = log.currentStep;

      if (step === 1) {
        subject = campaign.sequenceTemplates.step1.subject;
        body = campaign.sequenceTemplates.step1.body;
      } else if (step === 2) {
        subject = campaign.sequenceTemplates.step2.subject;
        body = campaign.sequenceTemplates.step2.body;
      } else if (step === 3) {
        subject = campaign.sequenceTemplates.step3.subject;
        body = campaign.sequenceTemplates.step3.body;
      } else {
        log.status = 'completed';
        await log.save();
        continue;
      }

      // Replace variables in templates
      const personalizedSubject = subject
        .replace(/\[Company\]/g, hr.companyName)
        .replace(/\[Company Name\]/g, hr.companyName)
        .replace(/\[Recruiter Name\]/g, hr.recruiterName);

      const personalizedBody = body
        .replace(/\[Company\]/g, hr.companyName)
        .replace(/\[Company Name\]/g, hr.companyName)
        .replace(/\[Recruiter Name\]/g, hr.recruiterName);

      // Previous messageId for follow-up threading
      const lastSentRecord = log.history[log.history.length - 1];
      const inReplyTo = lastSentRecord ? lastSentRecord.messageId : null;

      try {
        console.log(`[Scheduler] Dispatching Step ${step} email to ${hr.recruiterEmail} (${hr.companyName})...`);

        // Check if campaign requested attaching the resume file (default: true if resume file exists)
        const attachments = [];
        const shouldAttachResume = campaign.attachResume !== false;
        if (shouldAttachResume) {
          const userResume = await Resume.findOne({ userId: user._id });
          if (userResume && userResume.fileBuffer && userResume.fileBuffer.length > 0) {
            attachments.push({
              filename: userResume.fileName || `${(user.name || 'Candidate').replace(/\s+/g, '_')}_Resume.pdf`,
              content: userResume.fileBuffer,
              contentType: userResume.fileContentType || 'application/pdf',
            });
            console.log(`[Scheduler] Attached resume PDF (${attachments[0].filename}) to email.`);
          }
        }

        const backendUrl = process.env.API_URL || 'http://localhost:5000';
        const trackingPixelUrl = `${backendUrl}/api/track/open/${log._id}/${step}`;

        const sendResult = await sendOutreachEmail({
          smtpConfig: user.smtpConfig,
          toEmail: hr.recruiterEmail,
          toName: hr.recruiterName,
          subject: personalizedSubject,
          body: personalizedBody,
          inReplyToMessageId: inReplyTo,
          attachments,
          trackingPixelUrl,
        });

        // Record history
        log.history.push({
          step,
          subject: personalizedSubject,
          body: personalizedBody,
          sentAt: new Date(),
          messageId: sendResult.messageId,
          status: 'sent',
        });

        log.lastSentAt = new Date();

        // Advance to next step or complete
        if (step === 1) {
          const delayDays = campaign.sequenceTemplates.step2.delayDays || 3;
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + delayDays);
          log.currentStep = 2;
          log.nextSendAt = nextDate;
          log.status = 'scheduled';
        } else if (step === 2) {
          const delayDays = campaign.sequenceTemplates.step3.delayDays || 4;
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + delayDays);
          log.currentStep = 3;
          log.nextSendAt = nextDate;
          log.status = 'scheduled';
        } else {
          log.currentStep = 4;
          log.status = 'completed';
        }

        await log.save();

        // Update campaign stats
        await Campaign.findByIdAndUpdate(campaign._id, {
          $inc: { 'stats.sent': 1 },
        });

        console.log(`[Scheduler] Step ${step} email successfully delivered to ${hr.recruiterEmail}`);
      } catch (sendError) {
        console.error(`[Scheduler] Send failed to ${hr.recruiterEmail}:`, sendError.message);
        log.history.push({
          step,
          subject: personalizedSubject,
          body: personalizedBody,
          sentAt: new Date(),
          status: 'failed',
          errorMessage: sendError.message,
        });
        log.status = 'failed';
        await log.save();
      }
    }
  } catch (error) {
    console.error('[Scheduler] Error in processPendingOutreach:', error.message);
  } finally {
    isJobRunning = false;
  }
};

/**
 * Initializes the background cron task (runs every 60 seconds)
 */
export const startOutreachScheduler = () => {
  console.log('[Scheduler] Background outreach scheduler started (interval: 60s)');
  // Runs every minute
  cron.schedule('* * * * *', async () => {
    await processPendingOutreach();
  });
};
