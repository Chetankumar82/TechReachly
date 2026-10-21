import { Campaign } from '../models/Campaign.js';
import { OutreachLog } from '../models/OutreachLog.js';
import { Resume } from '../models/Resume.js';
import { HRContact } from '../models/HRContact.js';
import { User } from '../models/User.js';
import { generateSpeculativePitch, analyzeJobDescriptionMatch, generateSubjectLineVariations } from '../services/geminiService.js';
import { sendOutreachEmail } from '../services/mailerService.js';

// @route   POST /api/campaigns/match-score
export const analyzeJdMatch = async (req, res) => {
  try {
    const { jobDescription, model = 'gemini-3.8-flash', apiKey } = req.body;

    if (!jobDescription || jobDescription.trim().length < 15) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid Job Description with at least 15 characters to analyze match fit.',
      });
    }

    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume || !resume.parsedData) {
      return res.status(400).json({
        success: false,
        message: 'Please upload and parse your resume first before analyzing job match.',
      });
    }

    const effectiveApiKey = (apiKey && apiKey.trim()) || req.user.geminiApiKey || process.env.GEMINI_API_KEY;

    const analysis = await analyzeJobDescriptionMatch({
      candidateProfile: resume.parsedData,
      jobDescription,
      model,
      apiKey: effectiveApiKey,
    });

    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/campaigns/generate-pitch
export const generateAiPitches = async (req, res) => {
  try {
    const { hrContactId, jobDescription, tone = 'confident & polite', model = 'gemini-3.8-flash', apiKey } = req.body;

    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume || !resume.parsedData) {
      return res.status(400).json({
        success: false,
        message: 'Please upload and parse your resume first before generating AI pitches',
      });
    }

    let hrContact = null;
    if (hrContactId) {
      hrContact = await HRContact.findById(hrContactId);
    }

    if (!hrContact) {
      // Default sample company context if none specified
      hrContact = {
        companyName: 'Tech Innovators',
        recruiterName: 'Hiring Lead',
        recruiterTitle: 'Talent Acquisition Lead',
        techStack: resume.parsedData.skills.slice(0, 4),
        industry: 'Software Engineering',
      };
    }

    const effectiveApiKey = (apiKey && apiKey.trim()) || req.user.geminiApiKey || process.env.GEMINI_API_KEY;

    const sequence = await generateSpeculativePitch({
      candidateProfile: resume.parsedData,
      hrContact,
      jobDescription,
      tone,
      model,
      apiKey: effectiveApiKey,
    });

    if (!sequence) {
      return res.status(500).json({
        success: false,
        message: 'AI pitch generation failed. Please check your Gemini API key in Settings and try again.',
      });
    }

    res.json({ success: true, data: sequence });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/campaigns/generate-subject-lines
export const generateSubjectLinesController = async (req, res) => {
  try {
    const { hrContactId, jobDescription, model = 'gemini-3.8-flash', apiKey } = req.body;

    const resume = await Resume.findOne({ userId: req.user._id });
    if (!resume || !resume.parsedData) {
      return res.status(400).json({
        success: false,
        message: 'Please upload and parse your resume first before generating subject lines',
      });
    }

    let hrContact = null;
    if (hrContactId) {
      hrContact = await HRContact.findById(hrContactId);
    }

    if (!hrContact) {
      hrContact = {
        companyName: 'Tech Innovators',
        recruiterName: 'Hiring Lead',
        recruiterTitle: 'Talent Acquisition',
        techStack: resume.parsedData.skills.slice(0, 4),
      };
    }

    const effectiveApiKey = (apiKey && apiKey.trim()) || req.user.geminiApiKey || process.env.GEMINI_API_KEY;

    const variations = await generateSubjectLineVariations({
      candidateProfile: resume.parsedData,
      hrContact,
      jobDescription,
      model,
      apiKey: effectiveApiKey,
    });

    res.json({ success: true, data: variations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/campaigns
export const createCampaign = async (req, res) => {
  try {
    const { name, targetContactIds, sequenceTemplates, attachResume } = req.body;

    if (!name || !targetContactIds || targetContactIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Campaign name and target contacts are required' });
    }

    if (!sequenceTemplates || !sequenceTemplates.step1 || !sequenceTemplates.step1.subject?.trim() || !sequenceTemplates.step1.body?.trim()) {
      return res.status(400).json({ success: false, message: 'Initial pitch subject and body are required' });
    }

    const campaign = await Campaign.create({
      userId: req.user._id,
      name,
      targetContacts: targetContactIds,
      sequenceTemplates,
      attachResume: Boolean(attachResume),
      stats: {
        total: targetContactIds.length,
        sent: 0,
        replied: 0,
        bounced: 0,
        pending: targetContactIds.length,
      },
    });

    // Stagger initial sends across candidates (e.g. 3-4 minutes apart) to ensure deliverability
    const now = Date.now();
    const intervalMinutes = 3.5;

    const logsToCreate = targetContactIds.map((hrId, index) => {
      const scheduledTime = new Date(now + index * intervalMinutes * 60 * 1000);
      return {
        campaignId: campaign._id,
        userId: req.user._id,
        hrContactId: hrId,
        currentStep: 1,
        status: 'scheduled',
        nextSendAt: scheduledTime,
        history: [],
      };
    });

    await OutreachLog.insertMany(logsToCreate);

    res.status(201).json({
      success: true,
      message: `Campaign created with ${targetContactIds.length} recipients scheduled`,
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/campaigns
export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/campaigns/:id
export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('targetContacts');

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const logs = await OutreachLog.find({ campaignId: campaign._id })
      .populate('hrContactId')
      .sort({ createdAt: -1 });

    // Clean up any orphaned logs whose recruiter was deleted
    const validLogs = logs.filter((l) => l.hrContactId != null);

    res.json({
      success: true,
      data: {
        campaign,
        logs: validLogs,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PATCH /api/campaigns/:id/status
export const toggleCampaignStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user._id });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    campaign.status = status;
    await campaign.save();

    // If paused, pause associated pending logs; if resumed, resume them
    if (status === 'paused') {
      await OutreachLog.updateMany(
        { campaignId: campaign._id, status: 'scheduled' },
        { status: 'paused' }
      );
    } else if (status === 'active') {
      await OutreachLog.updateMany(
        { campaignId: campaign._id, status: 'paused' },
        { status: 'scheduled' }
      );
    }

    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/campaigns/:id/retry
export const retryCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user._id });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Set campaign status to active so scheduler dispatches it
    campaign.status = 'active';
    await campaign.save();

    // Reset failed, paused, or scheduled logs for this campaign to scheduled with nextSendAt: now
    const result = await OutreachLog.updateMany(
      { campaignId: campaign._id, status: { $in: ['failed', 'paused', 'scheduled'] } },
      { status: 'scheduled', stopReason: '', nextSendAt: new Date() }
    );

    // Trigger dispatcher immediately without waiting for next cron tick
    const { processPendingOutreach } = await import('../services/schedulerService.js');
    processPendingOutreach().catch((err) => console.error('[Scheduler] Immediate dispatch error:', err.message));

    res.json({
      success: true,
      message: `Activated campaign and queued ${result.modifiedCount} email(s) for immediate delivery`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   DELETE /api/campaigns/:id
export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user._id });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Cascade delete all associated outreach logs
    const logResult = await OutreachLog.deleteMany({ campaignId: campaign._id });

    // Delete the campaign
    await Campaign.deleteOne({ _id: campaign._id });

    res.json({
      success: true,
      message: `Campaign and ${logResult.deletedCount} associated log(s) deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/campaigns/:id/duplicate
export const duplicateCampaign = async (req, res) => {
  try {
    const original = await Campaign.findOne({ _id: req.params.id, userId: req.user._id });
    if (!original) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const cloned = await Campaign.create({
      userId: req.user._id,
      name: `${original.name} (Copy)`,
      status: 'draft',
      attachResume: original.attachResume !== false,
      targetContacts: [],
      sequenceTemplates: original.sequenceTemplates,
      stats: { total: 0, sent: 0, opened: 0, replied: 0 },
    });

    res.status(201).json({
      success: true,
      message: `Duplicated "${original.name}" successfully`,
      data: cloned,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/campaigns/send-test-email
export const sendTestEmail = async (req, res) => {
  try {
    const {
      targetEmail,
      subject,
      body,
      stepNumber = 1,
      attachResume = true,
      sampleRecruiterName,
      sampleCompanyName,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.smtpConfig || !user.smtpConfig.authUser || !user.smtpConfig.authPass) {
      return res.status(400).json({
        success: false,
        message: 'Your email mailbox is not configured. Please go to Settings and enter your Gmail App Password / SMTP credentials.',
        requiresSmtp: true,
      });
    }

    if (!subject || !subject.trim() || !body || !body.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Subject and email body are required before sending a test preview.',
      });
    }

    // Determine recipient email: custom test email, or user.email, or user.smtpConfig.authUser
    const recipient = (targetEmail && targetEmail.trim()) || user.email || user.smtpConfig.authUser;

    const companyName = sampleCompanyName || 'Tech Innovators';
    const recruiterName = sampleRecruiterName || 'Talent Acquisition Lead';

    // Replace placeholder variables
    const cleanSubject = `[TEST PREVIEW - Step ${stepNumber}] ${subject
      .replace(/\[Company\]/g, companyName)
      .replace(/\[Company Name\]/g, companyName)
      .replace(/\[Recruiter Name\]/g, recruiterName)}`;

    const testNotice = `--- TEST EMAIL PREVIEW (TECHREACHLY) ---\nThis email demonstrates how Step ${stepNumber} will appear in an HR Recruiter's inbox.\nSimulated Recruiter: ${recruiterName}\nSimulated Target: ${companyName}\n----------------------------------------\n\n`;

    const cleanBody = testNotice + body
      .replace(/\[Company\]/g, companyName)
      .replace(/\[Company Name\]/g, companyName)
      .replace(/\[Recruiter Name\]/g, recruiterName);

    // Attach resume PDF if requested and file is stored
    const attachments = [];
    let attachedFileName = null;
    if (attachResume) {
      const userResume = await Resume.findOne({ userId: user._id });
      if (userResume && userResume.fileBuffer && userResume.fileBuffer.length > 0) {
        attachedFileName = userResume.fileName || `${(user.name || 'Candidate').replace(/\s+/g, '_')}_Resume.pdf`;
        attachments.push({
          filename: attachedFileName,
          content: userResume.fileBuffer,
          contentType: userResume.fileContentType || 'application/pdf',
        });
      }
    }

    const sendResult = await sendOutreachEmail({
      smtpConfig: user.smtpConfig,
      toEmail: recipient,
      toName: user.name || 'Candidate Preview',
      subject: cleanSubject,
      body: cleanBody,
      attachments,
    });

    res.json({
      success: true,
      message: `Test email for Step ${stepNumber} dispatched successfully to ${recipient}!`,
      hasAttachment: attachments.length > 0,
      attachmentName: attachedFileName,
      messageId: sendResult.messageId,
      recipient,
    });
  } catch (error) {
    console.error('[sendTestEmail Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/campaigns/logs/:logId/reply
export const markLogReplied = async (req, res) => {
  try {
    const { replyCategory = 'interview', replyNotes = '' } = req.body;
    const log = await OutreachLog.findOne({ _id: req.params.logId, userId: req.user._id });

    if (!log) {
      return res.status(404).json({ success: false, message: 'Outreach log entry not found' });
    }

    const wasAlreadyReplied = log.status === 'replied';

    log.status = 'replied';
    log.replyCategory = replyCategory;
    log.replyNotes = (replyNotes || '').trim();
    if (!log.replyReceivedAt) {
      log.replyReceivedAt = new Date();
    }
    log.stopReason = 'Recruiter replied - automated sequence halted';
    log.nextSendAt = null; // Ensure background scheduler never sends subsequent follow-up steps

    await log.save();

    if (!wasAlreadyReplied) {
      await Campaign.findByIdAndUpdate(log.campaignId, {
        $inc: { 'stats.replied': 1 },
      });
    }

    res.json({
      success: true,
      message: 'Recruiter response logged. Future automated follow-ups are safely halted.',
      data: log,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/campaigns/logs/:logId/unreply
export const undoLogReplied = async (req, res) => {
  try {
    const log = await OutreachLog.findOne({ _id: req.params.logId, userId: req.user._id });

    if (!log) {
      return res.status(404).json({ success: false, message: 'Outreach log entry not found' });
    }

    if (log.status !== 'replied') {
      return res.status(400).json({ success: false, message: 'Log is not currently marked as replied' });
    }

    log.status = log.currentStep >= 4 ? 'completed' : 'sent';
    log.stopReason = '';
    log.replyNotes = '';
    log.replyCategory = 'general';
    log.replyReceivedAt = null;

    // If there were pending steps, re-queue them
    if (log.currentStep < 4) {
      const campaign = await Campaign.findById(log.campaignId);
      const delayDays = log.currentStep === 2
        ? (campaign?.sequenceTemplates?.step2?.delayDays || 3)
        : (campaign?.sequenceTemplates?.step3?.delayDays || 4);
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + delayDays);
      log.nextSendAt = nextDate;
      log.status = 'scheduled';
    }

    await log.save();

    await Campaign.findByIdAndUpdate(log.campaignId, {
      $inc: { 'stats.replied': -1 },
    });

    res.json({
      success: true,
      message: 'Replied status reversed. Automated sequence restored.',
      data: log,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
