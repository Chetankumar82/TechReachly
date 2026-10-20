import mongoose from 'mongoose';

const BASE_URL = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:5173';

const logResult = (name, passed, details = '') => {
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${name}]: ${passed ? 'PASSED' : 'FAILED'} ${details ? '- ' + details : ''}`);
};

const runAllChecks = async () => {
  console.log('=====================================================');
  console.log('🔍 RUNNING COMPREHENSIVE SYSTEM VERIFICATION CHECKS');
  console.log('=====================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  const test = async (name, fn) => {
    totalCount++;
    try {
      const details = await fn();
      logResult(name, true, details);
      passedCount++;
    } catch (err) {
      logResult(name, false, err.message);
    }
  };

  // 1. Backend Health
  await test('1. Backend Server Health', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    if (data.status !== 'healthy') throw new Error('Status not healthy');
    return `Server responding (version: ${data.version})`;
  });

  // 2. Frontend UI Availability
  await test('2. Frontend Vite Server', async () => {
    const res = await fetch(FRONTEND_URL);
    if (!res.ok) throw new Error(`HTTP status: ${res.status}`);
    const html = await res.text();
    if (!html.includes('TechReachly')) throw new Error('Title missing');
    return 'HTML served with TechReachly metadata';
  });

  // 3. Database State Check
  await test('3. MongoDB Database State', async () => {
    await mongoose.connect('mongodb://127.0.0.1:27017/techreachly');
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const colNames = collections.map(c => c.name);
    return `Connected. Collections found: ${colNames.join(', ')}`;
  });

  // 4. Auth - Registration with unique user
  let testUserToken = '';
  const testEmail = `testuser_${Date.now()}@techreachly.com`;
  await test('4. User Registration Flow', async () => {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Automated Test Candidate',
        email: testEmail,
        password: 'Password123!',
      }),
    });
    const data = await res.json();
    if (!data.success || !data.data?.token) throw new Error(data.message || 'Token missing');
    testUserToken = data.data.token;
    return `Registered new user: ${testEmail}`;
  });

  // 5. Auth - Login
  await test('5. User Login Flow', async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!',
      }),
    });
    const data = await res.json();
    if (!data.success || !data.data?.token) throw new Error(data.message || 'Login failed');
    return 'Logged in and received valid JWT';
  });

  // 6. User Profile verification
  await test('6. Auth Me Endpoint', async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const data = await res.json();
    if (!data.success || data.data.email !== testEmail) throw new Error('Data mismatch');
    return `Verified profile for: ${data.data.name}`;
  });

  // 7. HR Directory - Fetching & Search
  let firstContactId = null;
  await test('7. HR Directory Search & Query', async () => {
    const res = await fetch(`${BASE_URL}/hr-contacts?search=React&limit=5`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const data = await res.json();
    if (!data.success || !data.data || data.data.length === 0) throw new Error('No contacts found for React');
    firstContactId = data.data[0]._id;
    return `Found ${data.data.length} recruiters hiring for React. (e.g. ${data.data[0].companyName})`;
  });

  // 8. Tech Stack Badges
  await test('8. HR Directory Tech Stacks', async () => {
    const res = await fetch(`${BASE_URL}/hr-contacts/tech-stacks`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const data = await res.json();
    if (!data.success || !data.data || data.data.length === 0) throw new Error('Tech stacks empty');
    return `Distinct hiring stacks: ${data.data.slice(0, 5).join(', ')}... (${data.data.length} total)`;
  });

  // 9. Candidate Profile Setup
  await test('9. Candidate Resume Update & Retrieval', async () => {
    const updateRes = await fetch(`${BASE_URL}/resume`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        parsedData: {
          fullName: 'Automated Test Candidate',
          currentRole: 'Senior Full Stack Engineer',
          experienceYears: 4,
          skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Docker'],
          summary: 'Specialized in scalable backend systems and high-converting frontend applications.',
          keyProjects: [
            {
              title: 'Automated Data Pipeline',
              description: 'Processes 100k daily requests with sub-100ms response time.',
              techStack: ['Node.js', 'MongoDB', 'Redis'],
              highlights: 'Reduced infra spend by 30%.',
            },
          ],
        },
      }),
    });
    const updateData = await updateRes.json();
    if (!updateData.success) throw new Error('Profile update failed');

    const getRes = await fetch(`${BASE_URL}/resume`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const getData = await getRes.json();
    if (!getData.success || getData.data.parsedData.currentRole !== 'Senior Full Stack Engineer') {
      throw new Error('Retrieved resume did not match');
    }
    return `Candidate profile stored with 6 skills and 1 highlighted project`;
  });

  // 10. Speculative AI Pitch Generation
  let generatedCadence = null;
  await test('10. AI Pitch Cadence Generation (Zero-JD)', async () => {
    const res = await fetch(`${BASE_URL}/campaigns/generate-pitch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        hrContactId: firstContactId,
        tone: 'confident & polite',
      }),
    });
    const data = await res.json();
    if (!data.success || !data.data?.step1?.subject || !data.data?.step2?.body) {
      throw new Error('AI sequence format invalid');
    }
    generatedCadence = data.data;
    return `Generated 3-step cadence. Step 1: "${generatedCadence.step1.subject}"`;
  });

  // 11. Campaign Creation with Staggered Drip Scheduling
  let createdCampaignId = null;
  await test('11. Campaign Launch & Staggered Queue Scheduling', async () => {
    const res = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({
        name: 'Automated Verification Campaign',
        targetContactIds: [firstContactId],
        sequenceTemplates: generatedCadence,
      }),
    });
    const data = await res.json();
    if (!data.success || !data.data?._id) throw new Error('Campaign creation failed');
    createdCampaignId = data.data._id;
    return `Campaign created (ID: ${createdCampaignId}) with 1 scheduled recipient log`;
  });

  // 12. Campaign Inspection & Status
  await test('12. Campaign Detail & Recipient Log Inspection', async () => {
    const res = await fetch(`${BASE_URL}/campaigns/${createdCampaignId}`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const data = await res.json();
    if (!data.success || !data.data?.campaign || !data.data?.logs) throw new Error('Campaign details missing');
    const log = data.data.logs[0];
    if (!log || log.currentStep !== 1 || log.status !== 'scheduled') throw new Error('Outreach log not scheduled');
    return `Status: ${data.data.campaign.status} | Recipient: ${log.hrContactId?.companyName} | Step: ${log.currentStep}`;
  });

  // 13. Campaign Pause & Resume
  await test('13. Campaign Status Toggle (Pause & Resume)', async () => {
    const pauseRes = await fetch(`${BASE_URL}/campaigns/${createdCampaignId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({ status: 'paused' }),
    });
    const pauseData = await pauseRes.json();
    if (pauseData.data.status !== 'paused') throw new Error('Pause failed');

    const resumeRes = await fetch(`${BASE_URL}/campaigns/${createdCampaignId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testUserToken}`,
      },
      body: JSON.stringify({ status: 'active' }),
    });
    const resumeData = await resumeRes.json();
    if (resumeData.data.status !== 'active') throw new Error('Resume failed');

    return 'Successfully paused and resumed campaign';
  });

  // 14. Analytics Dashboard Aggregates
  await test('14. Dashboard Analytics Aggregator', async () => {
    const res = await fetch(`${BASE_URL}/analytics/dashboard`, {
      headers: { Authorization: `Bearer ${testUserToken}` },
    });
    const data = await res.json();
    if (!data.success) throw new Error('Analytics failed');
    return `Active Campaigns: ${data.data.activeCampaigns} | Total Directory HRs: ${data.data.totalDirectoryHRs}`;
  });

  // Cleanup mongoose
  await mongoose.disconnect();

  console.log('\n=====================================================');
  console.log(`🎯 VERIFICATION SUMMARY: ${passedCount}/${totalCount} CHECKS PASSED`);
  console.log('=====================================================');
};

runAllChecks();
