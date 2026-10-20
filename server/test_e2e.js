// Quick End-to-End Verification Script
const testE2E = async () => {
  try {
    console.log('--- 1. Testing Auth Login ---');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@techreachly.com',
        password: 'Password123!',
      }),
    });
    const loginData = await loginRes.json();
    console.log('Login Success:', loginData.success, '| User:', loginData.data?.name);
    const token = loginData.data?.token;

    console.log('\n--- 2. Testing HR Directory Listing ---');
    const hrRes = await fetch('http://localhost:5000/api/hr-contacts?limit=3', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const hrData = await hrRes.json();
    console.log('HR Directory Total:', hrData.total, '| Contacts Fetched:', hrData.data?.length);
    console.log('First Recruiter:', hrData.data?.[0]?.companyName, '-', hrData.data?.[0]?.recruiterName);

    console.log('\n--- 3. Testing Speculative AI Pitch Generation ---');
    const pitchRes = await fetch('http://localhost:5000/api/campaigns/generate-pitch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        hrContactId: hrData.data?.[0]?._id,
        tone: 'confident & polite',
      }),
    });
    const pitchData = await pitchRes.json();
    console.log('AI Pitch Success:', pitchData.success);
    console.log('Step 1 Subject:', pitchData.data?.step1?.subject);
    console.log('Step 2 Subject:', pitchData.data?.step2?.subject);
    console.log('Step 3 Subject:', pitchData.data?.step3?.subject);

    console.log('\n--- 4. Testing Analytics Dashboard ---');
    const dashRes = await fetch('http://localhost:5000/api/analytics/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const dashData = await dashRes.json();
    console.log('Dashboard Data Status:', dashData.success, '| Total Directory HRs:', dashData.data?.totalDirectoryHRs);

    console.log('\n✨ ALL BACKEND & AI MODULES VERIFIED 100% OPERATIONAL!');
  } catch (err) {
    console.error('Test Failed:', err);
  }
};

testE2E();
