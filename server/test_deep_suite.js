import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  \x1b[32m✓ [PASS]\x1b[0m ${testName}`);
  } else {
    failedTests++;
    console.error(`  \x1b[31m✗ [FAIL]\x1b[0m ${testName} ${details ? '- ' + details : ''}`);
  }
}

async function runDeepTestSuite() {
  console.log('\n======================================================');
  console.log('🚀 TECHREACHLY DEEP END-TO-END TEST SUITE');
  console.log('======================================================\n');

  let candidateToken = '';
  let candidateId = '';
  let candidateEmail = 'demo@techreachly.com';

  let adminToken = '';
  let adminId = '';
  let adminEmail = 'admin@techreachly.com';

  // ----------------------------------------------------------------
  // 1. PUBLIC GUEST ACCESS & BOT-PROOF EMAIL MASKING
  // ----------------------------------------------------------------
  console.log('\x1b[36m▶ SUITE 1: Public Guest Access & Bot-Proof Email Masking\x1b[0m');

  const guestRes = await fetch(`${BASE_URL}/hr-contacts`);
  const guestData = await guestRes.json();

  assert(guestRes.status === 200, 'Guest request to /api/hr-contacts returns 200 OK');
  assert(guestData.success === true, 'Guest response has success === true');
  assert(guestData.isAuthenticated === false, 'Guest response flags isAuthenticated === false');
  assert(Array.isArray(guestData.data) && guestData.data.length > 0, `Guest retrieves recruiters (${guestData.data?.length} found)`);

  // Check every returned recruiter has masked email
  let allEmailsMasked = true;
  let sampleMaskedEmail = '';
  for (const c of guestData.data) {
    if (!c.recruiterEmail.includes('•••') || !c.isMasked) {
      allEmailsMasked = false;
      break;
    }
    if (!sampleMaskedEmail) sampleMaskedEmail = c.recruiterEmail;
  }
  assert(allEmailsMasked, `All ${guestData.data.length} emails in guest response are strictly masked (Sample: ${sampleMaskedEmail})`);

  // Guest search filter
  const guestSearchRes = await fetch(`${BASE_URL}/hr-contacts?search=Razorpay`);
  const guestSearchData = await guestSearchRes.json();
  assert(
    guestSearchData.data?.length > 0 && guestSearchData.data.every(c => c.companyName.toLowerCase().includes('razorpay') || c.recruiterEmail.toLowerCase().includes('razorpay')),
    'Guest search by company ("Razorpay") filters accurately'
  );

  // Guest tier filter
  const guestTierRes = await fetch(`${BASE_URL}/hr-contacts?tier=fintech`);
  const guestTierData = await guestTierRes.json();
  assert(guestTierData.data?.length > 0, `Guest tier filter ("fintech") returns categorized results (${guestTierData.data?.length})`);

  // Guest tech stack distinct list
  const guestTechRes = await fetch(`${BASE_URL}/hr-contacts/tech-stacks`);
  const guestTechData = await guestTechRes.json();
  assert(guestTechRes.status === 200 && Array.isArray(guestTechData.data) && guestTechData.data.length > 0, `Guest can fetch distinct tech stacks (${guestTechData.data?.length} stacks)`);

  // Guest pagination
  const guestPageRes = await fetch(`${BASE_URL}/hr-contacts?page=1&limit=5`);
  const guestPageData = await guestPageRes.json();
  assert(guestPageData.data?.length === 5, `Guest pagination returns exact limit slice (5 items)`);
  assert(guestPageData.pages >= 1 && guestPageData.total >= 5, `Guest pagination metadata is correct (Pages: ${guestPageData.pages}, Total: ${guestPageData.total})`);

  // ----------------------------------------------------------------
  // 2. CANDIDATE AUTHENTICATION & RECRUITER SUBMISSIONS
  // ----------------------------------------------------------------
  console.log('\n\x1b[36m▶ SUITE 2: Candidate Authentication & Recruiter Submissions\x1b[0m');

  const candLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: candidateEmail, password: 'Password123!' }),
  });
  const candLoginData = await candLoginRes.json();
  assert(candLoginRes.status === 200 && candLoginData.success, 'Candidate login succeeds with status 200');
  assert(candLoginData.data.role === 'candidate', `Candidate role is "candidate" (Received: ${candLoginData.data.role})`);
  candidateToken = candLoginData.data.token;
  candidateId = candLoginData.data._id;

  // Authenticated candidate sees real unmasked emails
  const candHrRes = await fetch(`${BASE_URL}/hr-contacts`, {
    headers: { Authorization: `Bearer ${candidateToken}` },
  });
  const candHrData = await candHrRes.json();
  assert(candHrData.isAuthenticated === true, 'Authenticated candidate flags isAuthenticated === true');
  assert(candHrData.data[0]?.isMasked === false, `Authenticated candidate receives unmasked email (e.g. ${candHrData.data[0]?.recruiterEmail})`);

  // Test: Free webmail rejection (@gmail.com)
  const gmailSubmitRes = await fetch(`${BASE_URL}/hr-contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candidateToken}` },
    body: JSON.stringify({
      companyName: 'Acme Corp',
      recruiterName: 'John Doe',
      recruiterEmail: 'johndoe123@gmail.com',
      recruiterTitle: 'Hiring Lead',
    }),
  });
  const gmailSubmitData = await gmailSubmitRes.json();
  assert(gmailSubmitRes.status === 400 && !gmailSubmitData.success, 'Candidate submitting personal webmail (@gmail.com) is REJECTED with 400');
  assert(gmailSubmitData.message.includes('corporate work email'), `Rejection message indicates corporate email required: "${gmailSubmitData.message}"`);

  // Test: Invalid email format rejection
  const invalidEmailRes = await fetch(`${BASE_URL}/hr-contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candidateToken}` },
    body: JSON.stringify({
      companyName: 'Acme Corp',
      recruiterName: 'John Doe',
      recruiterEmail: 'not-an-email',
    }),
  });
  assert(invalidEmailRes.status === 400, 'Candidate submitting invalid email format is REJECTED with 400');

  // Test: Missing required company or name rejection
  const missingFieldRes = await fetch(`${BASE_URL}/hr-contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candidateToken}` },
    body: JSON.stringify({
      companyName: '',
      recruiterName: '',
      recruiterEmail: 'lead@uber.com',
    }),
  });
  assert(missingFieldRes.status === 400, 'Candidate submitting missing fields is REJECTED with 400');

  // Test: Duplicate approved recruiter rejection
  const duplicateApprovedRes = await fetch(`${BASE_URL}/hr-contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candidateToken}` },
    body: JSON.stringify({
      companyName: 'Razorpay',
      recruiterName: 'Priya Sharma',
      recruiterEmail: 'priya.sharma@razorpay.com', // Already in approved directory
    }),
  });
  assert(duplicateApprovedRes.status === 400, 'Candidate submitting existing approved recruiter is REJECTED as duplicate (400)');

  // Test: Valid candidate submission
  const testRecruiterEmail = `talent.lead_${Date.now()}@figma.com`;
  const validSubmitRes = await fetch(`${BASE_URL}/hr-contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candidateToken}` },
    body: JSON.stringify({
      companyName: 'Figma',
      recruiterName: 'Claire Zhang',
      recruiterEmail: testRecruiterEmail,
      recruiterTitle: 'Senior Design Systems Recruiter',
      techStack: 'React, TypeScript, WebAssembly, C++',
      website: 'https://figma.com',
      location: 'San Francisco / Remote',
      submissionNotes: 'Sourced from Figma Careers page for Frontend roles',
    }),
  });
  const validSubmitData = await validSubmitRes.json();
  assert(validSubmitRes.status === 201 && validSubmitData.success, 'Candidate submitting valid corporate recruiter SUCCEEDS with 201');
  assert(validSubmitData.data?.status === 'pending', 'Submitted recruiter has status === "pending"');
  assert(validSubmitData.data?.verified === false, 'Submitted recruiter has verified === false');
  assert(validSubmitData.data?.submittedBy === candidateId, 'Submitted recruiter records candidate user ID in submittedBy');
  const pendingContactId = validSubmitData.data?._id;

  // Test: Duplicate pending recruiter rejection
  const duplicatePendingRes = await fetch(`${BASE_URL}/hr-contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candidateToken}` },
    body: JSON.stringify({
      companyName: 'Figma',
      recruiterName: 'Claire Zhang',
      recruiterEmail: testRecruiterEmail,
    }),
  });
  assert(duplicatePendingRes.status === 400, 'Submitting duplicate email already in pending queue is REJECTED (400)');

  // Candidate checks "my-submissions"
  const mySubRes = await fetch(`${BASE_URL}/hr-contacts/my-submissions`, {
    headers: { Authorization: `Bearer ${candidateToken}` },
  });
  const mySubData = await mySubRes.json();
  assert(mySubRes.status === 200 && mySubData.success, 'Candidate successfully fetches /api/hr-contacts/my-submissions');
  assert(mySubData.stats.pending >= 1, `Candidate tracker reflects pending count (pending: ${mySubData.stats.pending})`);
  const foundInMySub = mySubData.data.some(c => c._id === pendingContactId);
  assert(foundInMySub, 'Newly submitted contact appears in candidate\'s personal submissions list');

  // Candidate retracts/deletes own pending submission
  const retractRes = await fetch(`${BASE_URL}/hr-contacts/my-submissions/${pendingContactId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${candidateToken}` },
  });
  const retractData = await retractRes.json();
  assert(retractRes.status === 200 && retractData.success, 'Candidate can retract/delete their own pending submission (200 OK)');

  // ----------------------------------------------------------------
  // 3. ROLE-BASED ACCESS CONTROL (RBAC) & SECURITY FIREWALL
  // ----------------------------------------------------------------
  console.log('\n\x1b[36m▶ SUITE 3: Role-Based Access Control (RBAC) & Security Firewall\x1b[0m');

  // Unauthenticated call to admin routes
  const guestAdminPending = await fetch(`${BASE_URL}/hr-contacts/admin/pending`);
  assert(guestAdminPending.status === 401, 'Guest calling /admin/pending is blocked with 401 Unauthorized');

  const guestAdminStats = await fetch(`${BASE_URL}/hr-contacts/admin/stats`);
  assert(guestAdminStats.status === 401, 'Guest calling /admin/stats is blocked with 401 Unauthorized');

  // Candidate call to admin routes
  const candAdminPending = await fetch(`${BASE_URL}/hr-contacts/admin/pending`, {
    headers: { Authorization: `Bearer ${candidateToken}` },
  });
  assert(candAdminPending.status === 403, 'Candidate calling /admin/pending is BLOCKED with 403 Forbidden');

  const candAdminStats = await fetch(`${BASE_URL}/hr-contacts/admin/stats`, {
    headers: { Authorization: `Bearer ${candidateToken}` },
  });
  assert(candAdminStats.status === 403, 'Candidate calling /admin/stats is BLOCKED with 403 Forbidden');

  const candApproveCall = await fetch(`${BASE_URL}/hr-contacts/admin/someid/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${candidateToken}` },
  });
  assert(candApproveCall.status === 403, 'Candidate calling /admin/:id/approve is BLOCKED with 403 Forbidden');

  const candBulkDeleteCall = await fetch(`${BASE_URL}/hr-contacts/bulk-delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candidateToken}` },
    body: JSON.stringify({ ids: ['fakeid'] }),
  });
  assert(candBulkDeleteCall.status === 403, 'Candidate calling /hr-contacts/bulk-delete is BLOCKED with 403 Forbidden');

  // ----------------------------------------------------------------
  // 4. ADMIN MODERATION OPERATIONS & DECISION WORKFLOW
  // ----------------------------------------------------------------
  console.log('\n\x1b[36m▶ SUITE 4: Admin Moderation Operations & Decision Workflow\x1b[0m');

  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: 'Password123!' }),
  });
  const adminLoginData = await adminLoginRes.json();
  assert(adminLoginRes.status === 200 && adminLoginData.success, 'Admin login succeeds with status 200');
  assert(adminLoginData.data.role === 'admin', `Admin role is "admin" (Received: ${adminLoginData.data.role})`);
  adminToken = adminLoginData.data.token;
  adminId = adminLoginData.data._id;

  // Admin stats
  const adminStatsRes = await fetch(`${BASE_URL}/hr-contacts/admin/stats`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminStatsData = await adminStatsRes.json();
  assert(adminStatsRes.status === 200 && adminStatsData.success, 'Admin can fetch /admin/stats');
  assert(
    typeof adminStatsData.data.pendingCount === 'number' &&
    typeof adminStatsData.data.approvedCount === 'number' &&
    typeof adminStatsData.data.totalUsers === 'number',
    `Admin stats structure valid (Pending: ${adminStatsData.data.pendingCount}, Approved: ${adminStatsData.data.approvedCount}, Users: ${adminStatsData.data.totalUsers})`
  );

  // Candidate submits a lead to test REJECTION flow
  const rejectTestEmail = `reject.lead_${Date.now()}@openai.com`;
  const rejectSubRes = await fetch(`${BASE_URL}/hr-contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candidateToken}` },
    body: JSON.stringify({
      companyName: 'OpenAI',
      recruiterName: 'Sam Talent',
      recruiterEmail: rejectTestEmail,
      recruiterTitle: 'Research Recruiter',
    }),
  });
  const rejectSubData = await rejectSubRes.json();
  const rejectSubId = rejectSubData.data._id;

  // Admin checks pending list and audit signals
  const adminPendingRes = await fetch(`${BASE_URL}/hr-contacts/admin/pending`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminPendingData = await adminPendingRes.json();
  assert(adminPendingRes.status === 200 && adminPendingData.success, 'Admin can fetch pending moderation queue');
  const foundPending = adminPendingData.data.find(c => c._id === rejectSubId);
  assert(Boolean(foundPending), 'Admin sees the new pending submission in queue');
  assert(foundPending?.auditSignals?.isCorporateDomain === true, `Audit signal correctly verifies corporate domain (@${foundPending?.auditSignals?.domain})`);
  assert(foundPending?.auditSignals?.duplicateCount === 0, 'Audit signal correctly identifies 0 duplicate matches');

  // Admin edits lead before making decision
  const adminEditRes = await fetch(`${BASE_URL}/hr-contacts/${rejectSubId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      companyName: 'OpenAI Labs',
      recruiterTitle: 'Lead Research Recruiter',
    }),
  });
  const adminEditData = await adminEditRes.json();
  assert(adminEditRes.status === 200 && adminEditData.data.companyName === 'OpenAI Labs', 'Admin can edit company/details on any lead');

  // Admin REJECTS lead with reason
  const rejectFeedbackReason = 'Candidate profile unverified for Research TA role';
  const adminRejectRes = await fetch(`${BASE_URL}/hr-contacts/admin/${rejectSubId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ reason: rejectFeedbackReason }),
  });
  const adminRejectData = await adminRejectRes.json();
  assert(adminRejectRes.status === 200 && adminRejectData.data.status === 'rejected', 'Admin can reject submission with 200 OK');
  assert(adminRejectData.data.rejectionReason === rejectFeedbackReason, `Rejection reason stored correctly: "${adminRejectData.data.rejectionReason}"`);

  // Candidate verifies they see the rejection reason in their tracker
  const candCheckRejectionRes = await fetch(`${BASE_URL}/hr-contacts/my-submissions`, {
    headers: { Authorization: `Bearer ${candidateToken}` },
  });
  const candCheckRejectionData = await candCheckRejectionRes.json();
  const candRejectedItem = candCheckRejectionData.data.find(c => c._id === rejectSubId);
  assert(candRejectedItem?.status === 'rejected', 'Candidate tracker reflects status === "rejected"');
  assert(candRejectedItem?.rejectionReason === rejectFeedbackReason, 'Candidate sees exact admin feedback reason');

  // Candidate submits a lead to test APPROVAL flow
  const approveTestEmail = `approved.lead_${Date.now()}@datadoghq.com`;
  const approveSubRes = await fetch(`${BASE_URL}/hr-contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candidateToken}` },
    body: JSON.stringify({
      companyName: 'Datadog',
      recruiterName: 'Elena Rostova',
      recruiterEmail: approveTestEmail,
      recruiterTitle: 'Staff Technical Recruiter',
      techStack: 'Go, Python, React, Kubernetes',
      website: 'https://datadoghq.com',
    }),
  });
  const approveSubData = await approveSubRes.json();
  const approveSubId = approveSubData.data._id;

  // Admin APPROVES lead
  const adminApproveRes = await fetch(`${BASE_URL}/hr-contacts/admin/${approveSubId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminApproveData = await adminApproveRes.json();
  assert(adminApproveRes.status === 200 && adminApproveData.data.status === 'approved', 'Admin approves lead with status 200');
  assert(adminApproveData.data.verified === true, 'Approved lead has verified === true');

  // Verify that approved contact is now LIVE in public directory
  const publicVerifyRes = await fetch(`${BASE_URL}/hr-contacts?search=${encodeURIComponent(approveTestEmail)}`);
  const publicVerifyData = await publicVerifyRes.json();
  assert(publicVerifyData.total >= 1, 'Approved contact immediately appears in public directory search');
  assert(publicVerifyData.data[0]?.status === 'approved', 'Public contact has status === "approved"');

  // Candidate CANNOT delete an approved contact
  const candDeleteApprovedRes = await fetch(`${BASE_URL}/hr-contacts/my-submissions/${approveSubId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${candidateToken}` },
  });
  assert(candDeleteApprovedRes.status === 403, 'Candidate is BLOCKED (403) from deleting an approved global contact');

  // Admin Direct Add (bypasses moderation queue)
  const directAddEmail = `direct.admin_${Date.now()}@stripe.com`;
  const adminDirectAddRes = await fetch(`${BASE_URL}/hr-contacts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      companyName: 'Stripe',
      recruiterName: 'Patrick Collison TA',
      recruiterEmail: directAddEmail,
      recruiterTitle: 'Executive Recruiter',
      techStack: 'Ruby, TypeScript, Go',
    }),
  });
  const adminDirectAddData = await adminDirectAddRes.json();
  assert(adminDirectAddRes.status === 201 && adminDirectAddData.data.status === 'approved', 'Admin direct add instantly creates status === "approved"');
  assert(adminDirectAddData.data.verified === true, 'Admin direct add instantly marks verified === true');

  // Cleanup: Admin deletes test contacts created during this suite
  await fetch(`${BASE_URL}/hr-contacts/${rejectSubId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  await fetch(`${BASE_URL}/hr-contacts/${approveSubId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  await fetch(`${BASE_URL}/hr-contacts/${adminDirectAddData.data._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.log('  \x1b[32m✓ [CLEANUP]\x1b[0m Test entries safely removed');

  // ----------------------------------------------------------------
  // 5. INTERCONNECTED CORE WORKFLOWS
  // ----------------------------------------------------------------
  console.log('\n\x1b[36m▶ SUITE 5: Interconnected Workflows (AI Pitch, Campaigns, Analytics)\x1b[0m');

  // Analytics endpoint
  const analyticsRes = await fetch(`${BASE_URL}/analytics/dashboard`, {
    headers: { Authorization: `Bearer ${candidateToken}` },
  });
  const analyticsData = await analyticsRes.json();
  assert(analyticsRes.status === 200 && analyticsData.success, 'Candidate can fetch /api/analytics/dashboard');
  assert(typeof analyticsData.data?.totalDirectoryHRs === 'number', `Analytics reports total directory count: ${analyticsData.data?.totalDirectoryHRs}`);

  // AI pitch generator test with fallback
  const pitchRes = await fetch(`${BASE_URL}/campaigns/generate-pitch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${candidateToken}` },
    body: JSON.stringify({
      jobDescription: 'Looking for a Senior React & Node.js Engineer to build real-time financial dashboards.',
      companyName: 'Razorpay',
      recruiterName: 'Priya Sharma',
      persona: 'metrics',
      modelId: 'gemini-2.0-flash',
    }),
  });
  const pitchData = await pitchRes.json();
  assert(pitchRes.status === 200 && pitchData.success, 'AI pitch generator endpoint (/api/campaigns/generate-pitch) succeeds with 200');
  assert(Boolean(pitchData.data?.step1?.subject && pitchData.data?.step1?.body), 'Generated pitch includes Step 1 subject and body');
  assert(Boolean(pitchData.data?.step2?.body && pitchData.data?.step3?.body), 'Generated pitch includes multi-step cadence (Step 2 follow-up and Step 3 breakup)');

  // Password reset request
  const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: candidateEmail }),
  });
  const forgotData = await forgotRes.json();
  assert(forgotRes.status === 200 && forgotData.success, 'Forgot password endpoint dispatches recovery token (200 OK)');

  // ----------------------------------------------------------------
  // SUMMARY RESULTS
  // ----------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  if (failedTests === 0) {
    console.log('\x1b[32m🎉 ALL SYSTEMS & SECURITY CONTROLS 100% OPERATIONAL!\x1b[0m');
  } else {
    console.log(`\x1b[31m⚠️ ${failedTests} TEST(S) FAILED. INVESTIGATION REQUIRED.\x1b[0m`);
  }
  console.log('======================================================\n');

  process.exit(failedTests === 0 ? 0 : 1);
}

runDeepTestSuite().catch((err) => {
  console.error('\n💥 FATAL TEST ERROR:', err);
  process.exit(1);
});
