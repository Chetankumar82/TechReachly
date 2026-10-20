import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { testSmtpConnection, checkMailboxDeliverabilityHealth } from '../services/mailerService.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'techreachly_super_secure_jwt_secret_key_2026', {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      smtpConfig: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        authUser: email,
        senderName: name,
      },
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        smtpConfig: user.smtpConfig,
        outreachSettings: user.outreachSettings,
        geminiApiKey: user.geminiApiKey || '',
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        smtpConfig: user.smtpConfig,
        outreachSettings: user.outreachSettings,
        geminiApiKey: user.geminiApiKey || '',
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   PUT /api/auth/smtp
export const updateSmtpSettings = async (req, res) => {
  try {
    const { host, port, secure, authUser, authPass, senderName, dailyLimit, geminiApiKey } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Preserve existing password if user didn't enter a new one (blank string or undefined)
    const existingPass = user.smtpConfig?.authPass || '';
    const newPass = (authPass && typeof authPass === 'string' && authPass.trim() !== '')
      ? authPass.trim()
      : existingPass;

    user.smtpConfig = {
      host: host || user.smtpConfig?.host || 'smtp.gmail.com',
      port: Number(port) || user.smtpConfig?.port || 465,
      secure: secure !== undefined ? secure : user.smtpConfig?.secure !== false,
      authUser: authUser !== undefined ? authUser.trim() : user.smtpConfig?.authUser || '',
      authPass: newPass,
      senderName: senderName !== undefined ? senderName.trim() : user.smtpConfig?.senderName || user.name,
      verified: user.smtpConfig?.verified || false,
    };

    // If senderName is updated, sync user's display name across app
    if (senderName && typeof senderName === 'string' && senderName.trim() !== '') {
      user.name = senderName.trim();
    }

    if (dailyLimit !== undefined && dailyLimit !== null) {
      user.outreachSettings.dailyLimit = Number(dailyLimit);
    }

    if (geminiApiKey !== undefined) {
      user.geminiApiKey = geminiApiKey.trim();
    }

    await user.save();

    // Auto-resume paused or credential-failed emails now that SMTP credentials are saved
    if (user.smtpConfig?.authUser && user.smtpConfig?.authPass) {
      const { OutreachLog } = await import('../models/OutreachLog.js');
      const resumed = await OutreachLog.updateMany(
        {
          userId: user._id,
          status: { $in: ['paused', 'failed'] },
        },
        {
          status: 'scheduled',
          stopReason: '',
          nextSendAt: new Date(),
        }
      );
      if (resumed.modifiedCount > 0) {
        const { processPendingOutreach } = await import('../services/schedulerService.js');
        processPendingOutreach().catch((err) =>
          console.error('[Scheduler] Auto-resume dispatch error:', err.message)
        );
      }
    }

    // Fetch and return the full sanitized user document
    const updatedUser = await User.findById(user._id).select('-passwordHash');

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/auth/smtp/test
export const testSmtp = async (req, res) => {
  try {
    const { host, port, secure, authUser, authPass } = req.body;

    const user = await User.findById(req.user._id);

    // If authPass is blank in request, fall back to already saved password
    const effectivePass = (authPass && typeof authPass === 'string' && authPass.trim() !== '')
      ? authPass.trim()
      : user?.smtpConfig?.authPass || '';

    const testConfig = {
      host: host || user?.smtpConfig?.host || 'smtp.gmail.com',
      port: port || user?.smtpConfig?.port || 465,
      secure: secure !== undefined ? secure : user?.smtpConfig?.secure !== false,
      authUser: authUser || user?.smtpConfig?.authUser,
      authPass: effectivePass,
    };

    const result = await testSmtpConnection(testConfig);

    if (result.success) {
      await User.findByIdAndUpdate(req.user._id, {
        'smtpConfig.verified': true,
        'smtpConfig.lastVerifiedAt': new Date(),
      });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/auth/smtp/audit
export const auditDeliverability = async (req, res) => {
  try {
    const { host, port, secure, authUser, authPass } = req.body;
    const user = await User.findById(req.user._id);

    const effectivePass = (authPass && typeof authPass === 'string' && authPass.trim() !== '')
      ? authPass.trim()
      : user?.smtpConfig?.authPass || '';

    const testConfig = {
      host: host || user?.smtpConfig?.host || 'smtp.gmail.com',
      port: port || user?.smtpConfig?.port || 465,
      secure: secure !== undefined ? secure : user?.smtpConfig?.secure !== false,
      authUser: authUser || user?.smtpConfig?.authUser,
      authPass: effectivePass,
    };

    const audit = await checkMailboxDeliverabilityHealth(testConfig, user?.outreachSettings || {});

    // If handshake passed, also update user's verified status
    if (audit.smtpVerified) {
      await User.findByIdAndUpdate(req.user._id, {
        'smtpConfig.verified': true,
        'smtpConfig.lastVerifiedAt': new Date(),
      });
    }

    res.json({ success: true, data: audit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/auth/gemini/test
export const testGemini = async (req, res) => {
  try {
    const { geminiApiKey } = req.body;
    const keyToTest = geminiApiKey || req.user.geminiApiKey || process.env.GEMINI_API_KEY;
    const { testGeminiApiKey } = await import('../services/geminiService.js');
    const result = await testGeminiApiKey(keyToTest);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/auth/forgot-password
// Generates a reset token and sends it to the user's email via their saved SMTP config
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return success anyway to prevent email enumeration
      return res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate a cryptographically secure 32-byte hex token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 minutes
    await user.save();

    // Determine the frontend base URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    // Attempt to send reset email via the user's own SMTP config (if configured)
    // OR via the system SMTP env vars as fallback
    const smtpConfig = (user.smtpConfig?.authUser && user.smtpConfig?.authPass)
      ? user.smtpConfig
      : {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: Number(process.env.SMTP_PORT) || 465,
          secure: true,
          authUser: process.env.SMTP_USER || '',
          authPass: process.env.SMTP_PASS || '',
          senderName: 'TechReachly',
        };

    const emailBody = `Hi ${user.name},

You requested a password reset for your TechReachly workspace.

Click the link below to reset your password (valid for 15 minutes):

${resetUrl}

If you did not request this, please ignore this email. Your password will remain unchanged.

– TechReachly Security Team`;

    try {
      const { sendOutreachEmail } = await import('../services/mailerService.js');
      await sendOutreachEmail({
        smtpConfig,
        toEmail: user.email,
        toName: user.name,
        subject: 'TechReachly — Password Reset Request',
        body: emailBody,
      });
    } catch (mailErr) {
      console.error('[ForgotPassword] Failed to send reset email:', mailErr.message);
      // Still return success to avoid enumeration, but log the error
    }

    res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route   POST /api/auth/reset-password
// Validates the reset token and sets a new password
export const resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({ success: false, message: 'Token, email, and new password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset link is invalid or has expired. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
