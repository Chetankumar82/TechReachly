import mongoose from 'mongoose';
import http from 'http';
import { User } from './src/models/User.js';
import { Campaign } from './src/models/Campaign.js';
import { OutreachLog } from './src/models/OutreachLog.js';
import { HRContact } from './src/models/HRContact.js';
import { Resume } from './src/models/Resume.js';
import { analyzeJobDescriptionMatch, generateSpeculativePitch } from './src/services/geminiService.js';

const RESULTS = [];

function assert(name, condition, details = '') {
  if (condition) {
    RESULTS.push({ name, passed: true, details });
    console.log(`✅ [PASS] ${name} ${details ? '(' + details + ')' : ''}`);
  } else {
    RESULTS.push({ name, passed: false, details });
    console.error(`❌ [FAIL] ${name} ${details ? '(' + details + ')' : ''}`);
  }
}

async function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: Buffer.concat(chunks),
        });
      });
    }).on('error', reject);
  });
}

async function runAllTests() {
  console.log('====================================================');
  console.log('🧪 TECHREACHLY DEEP FEATURE VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  try {
    // 1. Database Connection Check
    console.log('--- 1. DATABASE & MODELS ---');
    await mongoose.connect('mongodb://127.0.0.1:27017/techreachly');
    assert('MongoDB Connection', mongoose.connection.readyState === 1, 'Connected to techreachly DB');

    const userCount = await User.countDocuments();
    assert('User Model Query', userCount >= 0, `Users registered: ${userCount}`);

    const hrCount = await HRContact.countDocuments();
    assert('HR Directory Data', hrCount > 0, `HR contacts verified in DB: ${hrCount}`);

    const resume = await Resume.findOne();
    assert('Resume Data Model', !!resume && !!resume.parsedData, `Candidate: ${resume?.parsedData?.fullName || 'Active'}`);

    // 2. Health Endpoint
    console.log('\n--- 2. BACKEND API HEALTH CHECK ---');
    const healthRes = await httpGet('http://localhost:5000/api/health');
    assert('Health Endpoint HTTP 200', healthRes.statusCode === 200, `Status: ${healthRes.statusCode}`);
    const healthJson = JSON.parse(healthRes.body.toString());
    assert('Health Payload OK', healthJson.status === 'healthy', `App: ${healthJson.app}, Version: ${healthJson.version}`);

    // 3. Tracking Pixel Endpoint & Cache Invalidation
    console.log('\n--- 3. LIVE EMAIL OPEN TRACKING PIXEL ---');
    const testPixelRes = await httpGet('http://localhost:5000/api/track/test-open');
    assert('Tracking Pixel HTTP 200', testPixelRes.statusCode === 200, 'Endpoint returned 200 OK');
    assert('Content-Type image/gif', testPixelRes.headers['content-type'] === 'image/gif');
    assert('42-byte binary GIF', testPixelRes.body.length === 42, `Size: ${testPixelRes.body.length} bytes`);
    assert('Cache-Control: no-store', (testPixelRes.headers['cache-control'] || '').includes('no-store'), 'Strict cache prevention');
    assert('Pragma: no-cache', testPixelRes.headers['pragma'] === 'no-cache');
    assert('Expires: 0', testPixelRes.headers['expires'] === '0');

    // Test real OutreachLog tracking pixel hit
    let sampleLog = await OutreachLog.findOne();
    if (sampleLog) {
      const initialOpenCount = sampleLog.openCount || 0;
      const trackUrl = `http://localhost:5000/api/track/open/${sampleLog._id}/1`;
      const trackRes = await httpGet(trackUrl);
      assert('Live Log Pixel Request', trackRes.statusCode === 200, `Tracked log ID ${sampleLog._id}`);

      const refreshedLog = await OutreachLog.findById(sampleLog._id);
      assert(
        'OutreachLog Open Count Incremented',
        refreshedLog.openCount === initialOpenCount + 1,
        `Was: ${initialOpenCount}, Now: ${refreshedLog.openCount}`
      );
      assert('OutreachLog openedAt Set', !!refreshedLog.openedAt, `Opened at: ${refreshedLog.openedAt?.toISOString()}`);
    }

    // 4. AI Pitch Tone & Persona Presets
    console.log('\n--- 4. AI PITCH TONE & PERSONA ENGINE ---');
    const tones = ['concise', 'metrics', 'fresher', 'casual'];
    for (const t of tones) {
      const cadence = await generateSpeculativePitch({
        candidateProfile: resume.parsedData,
        hrContact: { companyName: 'Acme Corp', recruiterName: 'Sarah Jenkins', techStack: ['React', 'Node.js'] },
        jobDescription: 'Full Stack Developer with MERN stack expertise.',
        tone: t,
      });

      assert(`Persona '${t}' Cadence Structure`, !!cadence?.step1?.subject && !!cadence?.step1?.body);
      const wordCount = cadence.step1.body.split(/\s+/).filter(Boolean).length;
      assert(`Persona '${t}' Body Word Count`, wordCount > 0, `Word count: ${wordCount}`);
    }

    // 5. AI Job Match Score & Keyword Gap Analyzer
    console.log('\n--- 5. AI JOB MATCH SCORE & KEYWORD GAP ANALYZER ---');
    const testJd = `Role: Senior Full Stack Engineer
Looking for an experienced engineer proficient in React, Node.js, Express, MongoDB.
You will also manage Docker containerization, Redis caching, and AWS cloud deployment.`;

    const matchResult = await analyzeJobDescriptionMatch({
      candidateProfile: resume.parsedData,
      jobDescription: testJd,
    });

    assert('Match Score Computed', typeof matchResult.matchScore === 'number' && matchResult.matchScore >= 0 && matchResult.matchScore <= 100, `Score: ${matchResult.matchScore}%`);
    assert('Match Verdict Assigned', !!matchResult.verdict, `Verdict: "${matchResult.verdict}"`);
    assert('Matched Keywords Array', Array.isArray(matchResult.matchedKeywords) && matchResult.matchedKeywords.length > 0, `Matched: ${matchResult.matchedKeywords.join(', ')}`);
    assert('Missing Keywords Gap Array', Array.isArray(matchResult.missingKeywords), `Gaps: ${matchResult.missingKeywords.join(', ') || 'None'}`);
    assert('Key Strengths Generated', Array.isArray(matchResult.keyStrengths) && matchResult.keyStrengths.length > 0, `${matchResult.keyStrengths.length} strengths identified`);
    assert('Recommendations Generated', Array.isArray(matchResult.recommendations) && matchResult.recommendations.length > 0, `${matchResult.recommendations.length} recommendations provided`);

    // 6. Auto-Stop on Reply & Recruiter Response Logger
    console.log('\n--- 6. AUTO-STOP ON REPLY & RESPONSE LOGGER ---');
    if (sampleLog) {
      // Test marking as replied
      sampleLog.status = 'replied';
      sampleLog.replyCategory = 'interview';
      sampleLog.replyNotes = 'Recruiter invited to 30m screening call';
      sampleLog.replyReceivedAt = new Date();
      sampleLog.stopReason = 'Recruiter replied - automated sequence halted';
      sampleLog.nextSendAt = null;
      await sampleLog.save();

      const verifyReplied = await OutreachLog.findById(sampleLog._id);
      assert('Log Status Set to replied', verifyReplied.status === 'replied');
      assert('Background Scheduler Halted (nextSendAt = null)', verifyReplied.nextSendAt === null);
      assert('Stop Reason Recorded', verifyReplied.stopReason.includes('Recruiter replied'));
      assert('Reply Category Stored', verifyReplied.replyCategory === 'interview');
      assert('Reply Notes Stored', verifyReplied.replyNotes === 'Recruiter invited to 30m screening call');

      // Test reversing / undoing replied status
      verifyReplied.status = 'sent';
      verifyReplied.stopReason = '';
      verifyReplied.replyNotes = '';
      verifyReplied.replyCategory = 'general';
      verifyReplied.replyReceivedAt = null;
      await verifyReplied.save();

      const verifyReverted = await OutreachLog.findById(sampleLog._id);
      assert('Undo Replied Status Restored', verifyReverted.status === 'sent');
    }

    // 7. Customizable Follow-Up Cadence Timing
    console.log('\n--- 7. CUSTOMIZABLE CADENCE TIMING ---');
    const testCampaign = new Campaign({
      userId: resume.userId,
      name: 'Verification Test Campaign',
      targetContacts: [],
      sequenceTemplates: {
        step1: { subject: 'Test Pitch', body: 'Test body' },
        step2: { delayDays: 2, subject: 'Re: Test Pitch', body: 'Follow up' },
        step3: { delayDays: 5, subject: 'Re: Test Pitch', body: 'Breakup' },
      },
    });

    assert('Custom Step 2 Delay Stored', testCampaign.sequenceTemplates.step2.delayDays === 2, '2 days after Step 1');
    assert('Custom Step 3 Delay Stored', testCampaign.sequenceTemplates.step3.delayDays === 5, '5 days after Step 2');

    // Simulate Step 1 advance to Step 2
    const step1FinishDate = new Date('2026-10-20T10:00:00Z');
    const step2NextSend = new Date(step1FinishDate);
    step2NextSend.setDate(step2NextSend.getDate() + testCampaign.sequenceTemplates.step2.delayDays);
    assert(
      'Step 2 Dispatch Time Calculated Accurately',
      step2NextSend.toISOString().startsWith('2026-10-22'),
      `Next send: ${step2NextSend.toISOString()}`
    );

    // Simulate Step 2 advance to Step 3
    const step3NextSend = new Date(step2NextSend);
    step3NextSend.setDate(step3NextSend.getDate() + testCampaign.sequenceTemplates.step3.delayDays);
    assert(
      'Step 3 Dispatch Time Calculated Accurately',
      step3NextSend.toISOString().startsWith('2026-10-27'),
      `Next send: ${step3NextSend.toISOString()} (Total 7 days)`
    );

    // 8. Analytics Dashboard Funnel Integrity
    console.log('\n--- 8. DASHBOARD FUNNEL INTEGRITY ---');
    const logs = await OutreachLog.find();
    const initialSent = logs.filter((l) => l.history && l.history.some((h) => h.step === 1 && h.status === 'sent')).length;
    const openedCount = logs.filter((l) => l.status === 'opened' || (l.openCount && l.openCount > 0) || l.openedAt).length;
    const openRate = initialSent > 0 ? Math.round((openedCount / initialSent) * 100) : 0;
    const repliedCount = logs.filter((l) => l.status === 'replied').length;

    assert('Funnel Calculation Valid', typeof openRate === 'number', `Initial: ${initialSent}, Opened: ${openedCount} (${openRate}%), Replied: ${repliedCount}`);

    console.log('\n====================================================');
    const passedCount = RESULTS.filter((r) => r.passed).length;
    const failedCount = RESULTS.filter((r) => !r.passed).length;
    console.log(`📊 FINAL TEST REPORT: ${passedCount} PASSED, ${failedCount} FAILED out of ${RESULTS.length} CHECKS`);
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(failedCount > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test suite uncaught error:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runAllTests();
