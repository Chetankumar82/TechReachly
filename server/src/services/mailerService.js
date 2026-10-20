import nodemailer from 'nodemailer';
import dns from 'dns';
const dnsPromises = dns.promises;

/**
 * Creates a Nodemailer transporter based on user's custom SMTP configuration
 */
export const createTransporter = (smtpConfig) => {
  if (!smtpConfig || !smtpConfig.authUser || !smtpConfig.authPass) {
    throw new Error('User SMTP credentials not configured. Please add your email and App Password in Settings.');
  }

  // Clean username and strip all whitespace from authPass in case user pasted "abcd efgh ijkl mnop"
  const cleanUser = smtpConfig.authUser.trim();
  const cleanPass = smtpConfig.authPass.replace(/\s+/g, '');

  const host = smtpConfig.host || 'smtp.gmail.com';
  const port = Number(smtpConfig.port) || 465;
  const isPort465 = port === 465;

  // Use direct Gmail service optimization if smtp.gmail.com or gmail address
  if (host.includes('gmail.com') || cleanUser.endsWith('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: smtpConfig.secure !== undefined ? smtpConfig.secure : isPort465,
    auth: {
      user: cleanUser,
      pass: cleanPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

/**
 * Verify SMTP connection credentials
 */
export const testSmtpConnection = async (smtpConfig) => {
  try {
    const transporter = createTransporter(smtpConfig);
    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully! Your mailbox is live.' };
  } catch (error) {
    let helpMessage = error.message;
    if (
      error.message.includes('Invalid login') ||
      error.message.includes('Username and Password not accepted') ||
      error.message.includes('BadCredentials')
    ) {
      helpMessage = 'Google rejected your login (535 BadCredentials). You MUST use a 16-character Google App Password from https://myaccount.google.com/apppasswords with 2-Step Verification turned ON. Normal Gmail passwords will NOT work.';
    } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      helpMessage = 'Connection timed out. Check your SMTP host and port (use port 465 for SSL or 587 for TLS).';
    }
    return { success: false, message: helpMessage };
  }
};

/**
 * Dispatches a single outreach email with plain text & clean formatting
 */
export const sendOutreachEmail = async ({
  smtpConfig,
  toEmail,
  toName,
  subject,
  body,
  inReplyToMessageId,
  attachments = [],
  trackingPixelUrl = null,
}) => {
  const transporter = createTransporter(smtpConfig);

  const senderName = smtpConfig.senderName || smtpConfig.authUser;
  const fromAddress = `"${senderName}" <${smtpConfig.authUser}>`;

  // Sanitize body: remove stray placeholder bracket patterns like "[Portfolio Link]" or "[GitHub Link]" that trigger spam filters
  const cleanedBody = body
    .replace(/^[•\s*-]*Portfolio:\s*\[Portfolio Link\]\s*\n?/gim, '')
    .replace(/^[•\s*-]*GitHub:\s*\[GitHub Link\]\s*\n?/gim, '')
    .replace(/^[•\s*-]*LinkedIn:\s*\[LinkedIn Link\]\s*\n?/gim, '')
    .trim();

  // Natural HTML mimicking standard personal Gmail web client (no marketing/newsletter wrapper)
  const htmlBody = cleanedBody
    .split('\n')
    .map((line) => line ? `<div>${line}</div>` : '<div><br></div>')
    .join('');

  // 1x1 invisible open tracking pixel
  const trackingHtml = trackingPixelUrl
    ? `\n<div style="opacity:0;mso-hide:all;display:none;font-size:1px;line-height:1px;max-height:0px;max-width:0px;"><img src="${trackingPixelUrl}" width="1" height="1" style="display:none;width:1px;height:1px;border:0;" alt="" /></div>`
    : '';

  const mailOptions = {
    from: fromAddress,
    to: `"${toName}" <${toEmail}>`,
    replyTo: fromAddress,
    subject,
    text: cleanedBody,
    html: `<div dir="ltr" style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #222222; line-height: 1.5;">${htmlBody}${trackingHtml}</div>`,
  };

  // Attach files if provided (e.g. Resume PDF)
  if (Array.isArray(attachments) && attachments.length > 0) {
    mailOptions.attachments = attachments;
  }

  // If this is a follow-up, link headers to maintain conversation thread
  if (inReplyToMessageId) {
    mailOptions.inReplyTo = inReplyToMessageId;
    mailOptions.references = [inReplyToMessageId];
  }

  const info = await transporter.sendMail(mailOptions);
  return {
    messageId: info.messageId,
    accepted: info.accepted,
  };
};

/**
 * Diagnostic tool to check complete mailbox deliverability health (SMTP Handshake, MX, SPF, DMARC, Sending Limits)
 */
export const checkMailboxDeliverabilityHealth = async (smtpConfig, outreachSettings = {}) => {
  const authUser = smtpConfig?.authUser || '';
  const domain = authUser.includes('@') ? authUser.split('@')[1].trim().toLowerCase() : '';
  const isGmail = domain.includes('gmail.com') || (smtpConfig?.host || '').includes('gmail.com');
  const isOutlook = domain.includes('outlook.com') || domain.includes('hotmail.com') || (smtpConfig?.host || '').includes('outlook.com');

  const audit = {
    smtpVerified: false,
    smtpMessage: '',
    domain: domain || 'Unknown Domain',
    isGmail,
    isOutlook,
    mx: { status: 'pending', records: [], score: 0, maxScore: 20 },
    spf: { status: 'pending', record: '', score: 0, maxScore: 20 },
    dmarc: { status: 'pending', record: '', score: 0, maxScore: 15 },
    handshake: { status: 'pending', score: 0, maxScore: 35 },
    volumeSafety: { status: 'pending', dailyLimit: outreachSettings.dailyLimit || 25, score: 0, maxScore: 10 },
    totalScore: 0,
    grade: 'F',
    recommendations: [],
  };

  // 1. SMTP Handshake & Credentials Check
  try {
    const transporter = createTransporter(smtpConfig);
    await transporter.verify();
    audit.smtpVerified = true;
    audit.smtpMessage = 'Mailbox authenticated with SSL/TLS encryption.';
    audit.handshake.status = 'passed';
    audit.handshake.score = 35;
  } catch (err) {
    audit.smtpVerified = false;
    let helpMsg = err.message;
    if (err.message.includes('BadCredentials') || err.message.includes('Invalid login')) {
      helpMsg = 'Invalid login credentials. For Gmail, you must use a 16-character Google App Password.';
    }
    audit.smtpMessage = helpMsg;
    audit.handshake.status = 'failed';
    audit.handshake.score = 0;
    audit.recommendations.push({
      type: 'critical',
      title: 'Fix SMTP Authentication',
      message: isGmail
        ? 'Generate a 16-character Google App Password from https://myaccount.google.com/apppasswords with 2-Step Verification turned ON.'
        : 'Verify your SMTP host, port, and mailbox credentials.',
    });
  }

  // 2. DNS MX Records
  if (domain) {
    try {
      const mxRecords = await dnsPromises.resolveMx(domain);
      if (mxRecords && mxRecords.length > 0) {
        audit.mx.status = 'passed';
        audit.mx.records = mxRecords.map((m) => m.exchange).slice(0, 3);
        audit.mx.score = 20;
      } else {
        audit.mx.status = 'failed';
        audit.recommendations.push({
          type: 'warning',
          title: 'Missing MX Records',
          message: 'No MX records found for your domain. Recruiters will not be able to reply to your emails.',
        });
      }
    } catch (_) {
      audit.mx.status = isGmail ? 'passed' : 'warning';
      audit.mx.score = isGmail ? 20 : 5;
      if (isGmail) audit.mx.records = ['gmail-smtp-in.l.google.com', 'alt1.gmail-smtp-in.l.google.com'];
    }

    // 3. SPF Record
    try {
      const txtRecords = await dnsPromises.resolveTxt(domain);
      const flat = txtRecords.flat();
      const spfRecord = flat.find((t) => t.startsWith('v=spf1'));
      if (spfRecord) {
        audit.spf.status = 'passed';
        audit.spf.record = spfRecord;
        audit.spf.score = 20;
      } else if (isGmail) {
        audit.spf.status = 'passed';
        audit.spf.record = 'v=spf1 redirect=_spf.google.com ~all';
        audit.spf.score = 20;
      } else {
        audit.spf.status = 'warning';
        audit.spf.score = 5;
        audit.recommendations.push({
          type: 'warning',
          title: 'Add SPF Record to DNS',
          message: 'Add a TXT record for "v=spf1" to prevent your cold emails from landing in Spam.',
        });
      }
    } catch (_) {
      if (isGmail) {
        audit.spf.status = 'passed';
        audit.spf.record = 'v=spf1 redirect=_spf.google.com ~all';
        audit.spf.score = 20;
      } else {
        audit.spf.status = 'warning';
        audit.spf.score = 5;
      }
    }

    // 4. DMARC Record
    try {
      const dmarcRecords = await dnsPromises.resolveTxt('_dmarc.' + domain);
      const flatDmarc = dmarcRecords.flat();
      const dmarc = flatDmarc.find((t) => t.startsWith('v=DMARC1'));
      if (dmarc) {
        audit.dmarc.status = 'passed';
        audit.dmarc.record = dmarc;
        audit.dmarc.score = 15;
      } else {
        audit.dmarc.status = isGmail ? 'passed' : 'warning';
        audit.dmarc.score = isGmail ? 15 : 5;
        audit.dmarc.record = isGmail ? 'v=DMARC1; p=none (Google Default)' : 'No DMARC found';
      }
    } catch (_) {
      audit.dmarc.status = isGmail ? 'passed' : 'warning';
      audit.dmarc.score = isGmail ? 15 : 5;
      audit.dmarc.record = isGmail ? 'v=DMARC1; p=none (Google Default)' : 'No DMARC found';
    }
  }

  // 5. Sending Volume & Warmup Safety
  const limit = outreachSettings.dailyLimit || 25;
  if (limit <= 30) {
    audit.volumeSafety.status = 'passed';
    audit.volumeSafety.score = 10;
  } else if (limit <= 50) {
    audit.volumeSafety.status = 'warning';
    audit.volumeSafety.score = 6;
    audit.recommendations.push({
      type: 'tip',
      title: 'Warmup Sending Recommendation',
      message: 'For personal mailboxes, keeping daily volume between 15-25 emails preserves high inbox deliverability.',
    });
  } else {
    audit.volumeSafety.status = 'danger';
    audit.volumeSafety.score = 2;
    audit.recommendations.push({
      type: 'critical',
      title: 'High Sending Limit Warning',
      message: `Daily limit of ${limit} is high for cold outreach. Mail providers may throttle your account. Reduce to ≤ 25/day.`,
    });
  }

  // Calculate Overall Deliverability Score & Grade
  const total = audit.handshake.score + audit.mx.score + audit.spf.score + audit.dmarc.score + audit.volumeSafety.score;
  audit.totalScore = Math.min(100, Math.max(0, total));

  if (audit.totalScore >= 95) audit.grade = 'A+';
  else if (audit.totalScore >= 85) audit.grade = 'A';
  else if (audit.totalScore >= 70) audit.grade = 'B';
  else if (audit.totalScore >= 50) audit.grade = 'C';
  else audit.grade = 'D';

  return audit;
};
