import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Send,
  Clock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Users,
  Building2,
  Briefcase,
  Target,
  Compass,
  Paperclip,
  FileText,
  Check,
  Mail,
  ExternalLink,
  Zap,
  BarChart2,
  GraduationCap,
  Coffee,
  TrendingUp,
  RotateCcw,
  Copy,
  Smartphone,
  Flame,
  ShieldAlert,
  Lightbulb,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const TONE_PRESETS = [
  {
    id: 'concise',
    label: 'Direct & Crisp',
    badge: '<75 Words',
    tagline: 'Ultra-fast read for busy VPs & Founders (3 punchy sentences)',
    icon: Zap,
    colorClasses: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  },
  {
    id: 'metrics',
    label: 'Metrics & Scale',
    badge: 'Data-Driven',
    tagline: 'Latency reduction, architecture, DB indexing & throughput',
    icon: BarChart2,
    colorClasses: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
  },
  {
    id: 'fresher',
    label: 'Fresher / Fast Learner',
    badge: 'Proof-of-Work',
    tagline: 'Hands-on deployed apps, Git hygiene & hunger to ship value',
    icon: GraduationCap,
    colorClasses: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
  },
  {
    id: 'casual',
    label: 'Startup Casual',
    badge: 'Peer-to-Peer',
    tagline: 'Warm developer-to-developer conversational peer tone',
    icon: Coffee,
    colorClasses: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
  },
];

export const CampaignWizard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [campaignName, setCampaignName] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState(1);

  // Resume attachment state (default: true)
  const [attachResume, setAttachResume] = useState(true);
  const [resumeInfo, setResumeInfo] = useState(null);

  // Cadence Options
  const [outreachMode, setOutreachMode] = useState('with_jd'); // 'with_jd' | 'speculative'
  const [jobDescription, setJobDescription] = useState('');
  const [model, setModel] = useState('gemini-3-flash-preview'); // 'gemini-3-flash-preview' | 'gemini-3.5-flash' | 'gemini-4-argon'
  const [tone, setTone] = useState('concise');
  const [customApiKey, setCustomApiKey] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Job Match Score & Keyword Gap Analyzer State
  const [analyzingMatch, setAnalyzingMatch] = useState(false);
  const [matchAnalysis, setMatchAnalysis] = useState(null);
  const [matchError, setMatchError] = useState(null);

  // Test Email to Myself State
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // AI Subject Line Variations & Deliverability State
  const [subjectVariations, setSubjectVariations] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [showSubjectPanel, setShowSubjectPanel] = useState(false);
  const [copiedSubjectIdx, setCopiedSubjectIdx] = useState(null);

  // 3-step cadence state
  const [sequenceTemplates, setSequenceTemplates] = useState({
    step1: {
      subject: '',
      body: '',
    },
    step2: {
      delayDays: 3,
      subject: '',
      body: '',
    },
    step3: {
      delayDays: 4,
      subject: '',
      body: '',
    },
  });

  const updateStepDelay = (stepKey, days) => {
    const num = Math.max(1, Math.min(30, parseInt(days, 10) || 1));
    setSequenceTemplates((prev) => ({
      ...prev,
      [stepKey]: {
        ...prev[stepKey],
        delayDays: num,
      },
    }));
  };

  const selectedContactIds = location.state?.selectedContactIds || [];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [contactsRes, resumeRes] = await Promise.allSettled([
          api.get('/hr-contacts'),
          api.get('/resume'),
        ]);

        if (contactsRes.status === 'fulfilled' && contactsRes.value.data?.success) {
          const all = contactsRes.value.data.data || [];
          if (selectedContactIds.length > 0) {
            const matched = all.filter((c) => selectedContactIds.includes(c._id));
            setSelectedContacts(matched);
            setCampaignName(`Outreach - ${matched[0]?.companyName || 'IT Companies'}`);
          } else {
            setSelectedContacts(all.slice(0, 3));
            setCampaignName('IT Engineering Opportunities Outreach');
          }
        }

        if (resumeRes.status === 'fulfilled' && resumeRes.value.data?.success) {
          const rData = resumeRes.value.data.data;
          setResumeInfo(rData);
          // If a file is available, default attachResume to true or keep false
          if (rData?.hasFile) {
            setAttachResume(true);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingContacts(false);
      }
    };
    loadData();
  }, []);

  const handleAnalyzeJobMatch = async () => {
    if (!jobDescription || jobDescription.trim().length < 15) {
      setMatchError('Please paste a Job Description with at least 15 characters to analyze match.');
      return;
    }

    setAnalyzingMatch(true);
    setMatchError(null);

    try {
      const res = await api.post('/campaigns/match-score', {
        jobDescription,
        model,
        apiKey: customApiKey || user?.geminiApiKey || undefined,
      });

      if (res.data?.success && res.data?.data) {
        setMatchAnalysis(res.data.data);
      }
    } catch (err) {
      setMatchError(
        err.response?.data?.message || 'Failed to analyze match score. Ensure your resume is uploaded.'
      );
    } finally {
      setAnalyzingMatch(false);
    }
  };

  const handleLoadSampleJd = () => {
    const sample = `Role: Full Stack Software Engineer (MERN / TypeScript)
Company: NextGen Systems Inc.
Location: Remote / Hybrid

Key Requirements:
- 1-3 years experience building production web applications with React, Node.js, Express, and MongoDB.
- Strong proficiency in JavaScript/TypeScript, RESTful APIs, and asynchronous architectures.
- Experience with Tailwind CSS or modern responsive styling frameworks.
- Exposure to Docker containerization, Redis caching, and CI/CD pipelines.
- Solid understanding of Git workflows, code reviews, and software testing (Jest/Playwright).
- Passion for shipping high-performance user interfaces and resilient backend microservices.`;
    setJobDescription(sample);
    setMatchAnalysis(null);
    setMatchError(null);
  };

  const handleGenerateAiPitch = async () => {
    if (outreachMode === 'with_jd' && !jobDescription.trim()) {
      setMessage({
        text: 'Please paste the Job Description (JD) text so the AI can match your resume against it.',
        type: 'error',
      });
      return;
    }

    setGeneratingAi(true);
    setMessage({ text: '', type: '' });

    try {
      const primaryContact = selectedContacts[0];
      const res = await api.post('/campaigns/generate-pitch', {
        hrContactId: primaryContact?._id,
        jobDescription: outreachMode === 'with_jd' ? jobDescription : '',
        tone,
        model,
        apiKey: customApiKey || user?.geminiApiKey || undefined,
      });

      if (res.data?.success && res.data?.data) {
        setSequenceTemplates((prev) => ({
          ...res.data.data,
          step2: {
            ...res.data.data.step2,
            delayDays: prev.step2?.delayDays || 3,
          },
          step3: {
            ...res.data.data.step3,
            delayDays: prev.step3?.delayDays || 4,
          },
        }));
        const engineLabel = model.includes('argon') || model.includes('pro')
          ? 'Gemini 4 Argon'
          : model.includes('3.5')
            ? 'Gemini 3.5 Flash'
            : 'Gemini 3 Flash';
        setMessage({
          text: `Cadence drafted via ${engineLabel}! Review below.`,
          type: 'success',
        });
        // Preload high-converting subject line variations
        handleGenerateSubjectLines(false);
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to generate AI pitch. Ensure your resume is uploaded.',
        type: 'error',
      });
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleGenerateSubjectLines = async (forceOpen = true) => {
    setLoadingSubjects(true);
    if (forceOpen) setShowSubjectPanel(true);
    try {
      const primaryContact = selectedContacts[0];
      const res = await api.post('/campaigns/generate-subject-lines', {
        hrContactId: primaryContact?._id,
        jobDescription: outreachMode === 'with_jd' ? jobDescription : '',
        model,
        apiKey: customApiKey || user?.geminiApiKey || undefined,
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        setSubjectVariations(res.data.data);
      }
    } catch (err) {
      console.error('Failed to generate subject variations:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleApplySubject = (text) => {
    setSequenceTemplates((prev) => ({
      ...prev,
      step1: { ...prev.step1, subject: text },
      step2: { ...prev.step2, subject: `Re: ${text}` },
      step3: { ...prev.step3, subject: `Re: ${text}` },
    }));
  };

  const handleCopySubject = (text, idx) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedSubjectIdx(idx);
    setTimeout(() => setCopiedSubjectIdx(null), 2000);
  };

  const analyzeSubjectHealth = (subject) => {
    if (!subject || !subject.trim()) return null;
    const text = subject.trim();
    const charCount = text.length;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const isMobileSafe = charCount <= 50;

    const spamTriggers = [
      'free', 'urgent', 'guaranteed', '100%', 'risk-free', 'winner',
      'act now', 'special offer', 'click here', 'exclusive deal', 'congratulations',
      'make money', 'earn cash', 'order now'
    ];
    const detectedSpam = spamTriggers.filter((word) =>
      new RegExp(`\\b${word}\\b`, 'i').test(text)
    );
    const hasExcessiveCaps = text.length > 8 && text === text.toUpperCase();
    const hasExclamation = text.includes('!');

    const warnings = [
      ...detectedSpam.map((w) => `Avoid trigger word "${w}"`),
      ...(hasExcessiveCaps ? ['Avoid ALL CAPS (spam trigger)'] : []),
      ...(hasExclamation ? ['Avoid exclamation marks'] : []),
    ];

    return {
      charCount,
      wordCount,
      isMobileSafe,
      warnings,
      isClean: warnings.length === 0,
    };
  };

  const handleLaunchCampaign = async () => {
    if (!campaignName.trim()) {
      setMessage({ text: 'Please enter a campaign name', type: 'error' });
      return;
    }

    if (!sequenceTemplates.step1.subject || !sequenceTemplates.step1.body) {
      setMessage({ text: 'Please generate or enter the Step 1 email subject and body', type: 'error' });
      return;
    }

    setLaunching(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await api.post('/campaigns', {
        name: campaignName,
        targetContactIds: selectedContacts.map((c) => c._id),
        sequenceTemplates,
        attachResume,
      });

      if (res.data?.success) {
        navigate('/campaigns', {
          state: { flashMessage: `Campaign "${campaignName}" launched! Automated sequences are now active.` },
        });
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to launch campaign',
        type: 'error',
      });
      setLaunching(false);
    }
  };

  const handleSendTestEmail = async () => {
    const currentStepKey = `step${activeStepTab}`;
    const stepTemplate = sequenceTemplates[currentStepKey];

    if (!stepTemplate || !stepTemplate.subject?.trim() || !stepTemplate.body?.trim()) {
      setTestResult({
        success: false,
        message: `Please draft or generate Step ${activeStepTab}'s subject and body first before sending a test preview.`,
      });
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    const primaryContact = selectedContacts[0];

    try {
      const res = await api.post('/campaigns/send-test-email', {
        targetEmail: testEmail.trim() || undefined,
        subject: stepTemplate.subject,
        body: stepTemplate.body,
        stepNumber: activeStepTab,
        attachResume: Boolean(attachResume),
        sampleCompanyName: primaryContact?.companyName || 'Google / Tech Innovators',
        sampleRecruiterName: primaryContact?.recruiterName || 'Talent Acquisition Team',
      });

      if (res.data?.success) {
        setTestResult({
          success: true,
          message: res.data.message || `Test email dispatched to ${res.data.recipient}!`,
          hasAttachment: res.data.hasAttachment,
          attachmentName: res.data.attachmentName,
        });
      }
    } catch (err) {
      console.error(err);
      const isSmtpMissing = err.response?.data?.requiresSmtp;
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'Failed to dispatch test email. Please check your SMTP settings.',
        requiresSmtp: isSmtpMissing,
      });
    } finally {
      setSendingTest(false);
    }
  };

  const primaryRecipient = selectedContacts[0] || {
    recruiterName: 'Technical Recruiter',
    recruiterEmail: 'recruiter@target-company.com',
    companyName: 'Tech Company',
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={() => navigate('/directory')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Recruiter Directory
        </button>
        <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2.5 py-0.5 rounded-full">
          Anti-Spam Jitter: 3.5m Delay
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Craft Outreach Cadence
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Match your resume against a specific Job Description or craft speculative cold pitches.
        </p>
      </div>

      {message.text && (
        <div
          className={`p-3.5 rounded-lg flex items-center gap-2.5 text-xs border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Target Recipients Overview */}
      <div className="saas-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
              Target Recipients ({selectedContacts.length})
            </span>
          </div>
          <input
            type="text"
            placeholder="Campaign Name..."
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            className="px-3 py-1.5 rounded-lg saas-input text-xs font-medium w-full sm:w-80"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedContacts.map((c) => (
            <span
              key={c._id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-slate-100 text-slate-700 border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 font-medium"
            >
              <Building2 className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
              <strong className="text-slate-900 dark:text-zinc-200">{c.companyName}:</strong> {c.recruiterName}
            </span>
          ))}
        </div>
      </div>

      {/* Mode Selector & Configuration */}
      <div className="saas-card p-5 space-y-5">
        <div>
          <label className="text-[11px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider block mb-2">
            Outreach Strategy
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOutreachMode('with_jd')}
              className={`p-4 rounded-xl border text-left transition-all ${
                outreachMode === 'with_jd'
                  ? 'border-indigo-600 bg-indigo-50/40 dark:border-indigo-500/80 dark:bg-zinc-900 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-slate-50/40 dark:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 dark:text-zinc-100 mb-1">
                <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Match with Job Description (JD)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                Paste job requirements. The AI compares your resume to the JD and maps your exact projects to solve their requirements.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setOutreachMode('speculative')}
              className={`p-4 rounded-xl border text-left transition-all ${
                outreachMode === 'speculative'
                  ? 'border-indigo-600 bg-indigo-50/40 dark:border-indigo-500/80 dark:bg-zinc-900 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-slate-50/40 dark:bg-zinc-900/40'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold text-xs text-slate-900 dark:text-zinc-100 mb-1">
                <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Speculative Cold Pitch (No JD)
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed">
                Reach out to tech leads and recruiters when there is no specific job post. Promotes your resume projects aligned with company domain.
              </p>
            </button>
          </div>
        </div>

        {/* Job Description Textarea & AI Match Gap Analyzer */}
        {outreachMode === 'with_jd' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                <span>Target Job Description (JD) Requirements</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleJd}
                  className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                >
                  <FileText className="w-3 h-3" />
                  Load Sample JD
                </button>
                <span className="text-slate-300 dark:text-zinc-700">·</span>
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                  Full text or requirements
                </span>
              </div>
            </div>

            <textarea
              rows={5}
              required
              placeholder="e.g. Looking for a Full Stack Developer proficient in React, Node.js, Express, MongoDB. You will build microservices and implement clean architectures..."
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                if (matchError) setMatchError(null);
              }}
              className="w-full px-3 py-2.5 rounded-lg saas-input text-xs font-sans leading-relaxed"
            />

            {/* Quick Action Bar for AI Match & Keyword Gap Analysis */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-0.5">
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Compare your uploaded resume against this JD for a 0-100% Match Score and missing keyword gap analysis.
              </p>
              <button
                type="button"
                onClick={handleAnalyzeJobMatch}
                disabled={analyzingMatch || !jobDescription.trim()}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
              >
                {analyzingMatch ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                    <span>Analyzing Match Fit...</span>
                  </>
                ) : (
                  <>
                    <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Analyze Match & Keyword Gap</span>
                  </>
                )}
              </button>
            </div>

            {/* Error Message */}
            {matchError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{matchError}</span>
              </div>
            )}

            {/* Match Analysis Results Card */}
            {matchAnalysis && (
              <div className="p-4 sm:p-5 rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-zinc-900/90 dark:via-zinc-900/70 dark:to-zinc-850/60 space-y-4 shadow-sm animate-fadeIn">
                {/* Header with Circular/Square Match Score Gauge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-bold border flex-shrink-0 shadow-xs ${
                        matchAnalysis.matchScore >= 80
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 ring-2 ring-emerald-500/20'
                          : matchAnalysis.matchScore >= 60
                          ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30 ring-2 ring-sky-500/20'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 ring-2 ring-amber-500/20'
                      }`}
                    >
                      <span className="text-xl leading-none">{matchAnalysis.matchScore}%</span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold mt-0.5">Match</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                            matchAnalysis.matchScore >= 80
                              ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                              : matchAnalysis.matchScore >= 60
                              ? 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30'
                              : 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {matchAnalysis.verdict}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
                          Resume Alignment & Keyword Coverage
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-zinc-300 mt-1 leading-relaxed max-w-2xl">
                        {matchAnalysis.summary}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMatchAnalysis(null)}
                    className="self-start text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Keyword Comparison Chips Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Matched Keywords */}
                  <div className="p-3.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/25 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Matched In Resume ({matchAnalysis.matchedKeywords?.length || 0})</span>
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">High Overlap</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {matchAnalysis.matchedKeywords && matchAnalysis.matchedKeywords.length > 0 ? (
                        matchAnalysis.matchedKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300/70 dark:border-emerald-700/50 shadow-2xs"
                          >
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 italic">No exact tech terms identified.</span>
                      )}
                    </div>
                  </div>

                  {/* Missing Keywords / Skill Gaps */}
                  <div className="p-3.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-500/25 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-900 dark:text-amber-300">
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Skill Gaps in JD ({matchAnalysis.missingKeywords?.length || 0})</span>
                      </span>
                      <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400">Mention In Pitch</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {matchAnalysis.missingKeywords && matchAnalysis.missingKeywords.length > 0 ? (
                        matchAnalysis.missingKeywords.map((kw, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-100/80 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-300/70 dark:border-amber-700/50 shadow-2xs"
                            title="Required by JD but not prominent in your parsed resume"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          🎉 Zero major tech gaps detected! Excellent fit.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Strengths & AI Recruiter Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                  {matchAnalysis.keyStrengths?.length > 0 && (
                    <div className="space-y-1.5 p-3 rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
                      <h4 className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Key Candidate Strengths</span>
                      </h4>
                      <ul className="space-y-1 text-[11px] text-slate-600 dark:text-zinc-300">
                        {matchAnalysis.keyStrengths.map((str, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-emerald-500 font-bold">✓</span>
                            <span>{str}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {matchAnalysis.recommendations?.length > 0 && (
                    <div className="space-y-1.5 p-3 rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800">
                      <h4 className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Outreach Recommendations</span>
                      </h4>
                      <ul className="space-y-1 text-[11px] text-slate-600 dark:text-zinc-300">
                        {matchAnalysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-500 font-bold">→</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-zinc-800">
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                    Draft outreach now to automatically emphasize these matched strengths in your pitch.
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateAiPitch}
                    disabled={generatingAi}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Draft Pitch With Matched Overlaps</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Pitch Tone & Persona Presets */}
        <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Select AI Outreach Tone & Persona</span>
            </label>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              Adapts email length, vocabulary & persuasion angle
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {TONE_PRESETS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = tone === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTone(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-500/30'
                      : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className={`p-1.5 rounded-lg border ${opt.colorClasses}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium ${
                        isSelected
                          ? 'bg-indigo-200/60 text-indigo-800 dark:bg-indigo-900/80 dark:text-indigo-200'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400'
                      }`}>
                        {opt.badge}
                      </span>
                    </div>

                    <div className="pt-0.5">
                      <h4 className={`text-xs font-bold ${
                        isSelected
                          ? 'text-indigo-950 dark:text-white'
                          : 'text-slate-800 dark:text-zinc-200'
                      }`}>
                        {opt.label}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-snug mt-1">
                        {opt.tagline}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-2.5 pt-2 border-t border-indigo-200/70 dark:border-indigo-900/60 flex items-center gap-1 text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
                      <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                      <span>Active Tone</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Engine & Generator Controls */}
        <div className="pt-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-3 flex-wrap text-xs">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1">
                  AI Model Engine
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="px-3 py-1.5 rounded-lg saas-input text-xs font-medium"
                >
                  <option value="gemini-3-flash-preview">Gemini 3 Flash (Fastest & Ultra Reliable)</option>
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Balanced Intelligence)</option>
                  <option value="gemini-4-argon">Gemini 4 Argon (Deep Strategic Reasoning)</option>
                </select>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-zinc-400 pb-1.5">
                Persona: <strong className="text-slate-800 dark:text-zinc-200">{TONE_PRESETS.find((p) => p.id === tone)?.label || 'Direct & Crisp'}</strong>
              </div>
            </div>

            <button
              onClick={handleGenerateAiPitch}
              disabled={generatingAi}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {generatingAi ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  Drafting with Gemini...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  {sequenceTemplates.step1.subject
                    ? `Regenerate (${TONE_PRESETS.find((p) => p.id === tone)?.label || 'Active Tone'})`
                    : outreachMode === 'with_jd'
                    ? 'Match JD & Draft Email'
                    : 'Generate Speculative Pitch'}
                </>
              )}
            </button>
          </div>

          {/* Optional: override Gemini API key for this session */}
          <div className="text-xs">
            <label className="block text-[10px] font-medium text-slate-500 dark:text-zinc-500 uppercase tracking-wider mb-1">
              Gemini API Key Override <span className="normal-case text-slate-400 dark:text-zinc-600">(optional — uses Settings key by default)</span>
            </label>
            <input
              type="password"
              placeholder="AIzaSy... — leave blank to use configured key"
              value={customApiKey}
              onChange={(e) => setCustomApiKey(e.target.value)}
              className="w-full sm:w-96 px-3 py-1.5 rounded-lg saas-input text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Resume Attachment & Deliverability Options */}
      <div className="saas-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5">
            <Paperclip className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                Attach Resume PDF to Emails
              </h3>
              {resumeInfo?.hasFile ? (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-medium">
                  <Check className="w-3 h-3" /> PDF File Loaded ({resumeInfo.fileName})
                </span>
              ) : (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-medium">
                  No PDF uploaded on Resume page
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
              When enabled, your uploaded resume PDF file is attached directly to outgoing emails.
              {resumeInfo?.parsedData?.links?.resume && (
                <span className="text-indigo-600 dark:text-indigo-400 ml-1 font-medium">
                  Your Google Drive link is also included for instant mobile viewing.
                </span>
              )}
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 self-start sm:self-auto">
          <input
            type="checkbox"
            checked={attachResume}
            disabled={!resumeInfo?.hasFile}
            onChange={(e) => setAttachResume(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-zinc-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-indigo-600"></div>
          <span className="ml-2 text-xs font-medium text-slate-700 dark:text-zinc-300">
            {attachResume ? 'Attach PDF File' : 'Link Only'}
          </span>
        </label>
      </div>

      {/* Modern Email Client Cadence Preview */}
      <div className="saas-card overflow-hidden">
        {/* macOS Window Titlebar */}
        <div className="px-4 py-2.5 bg-slate-100 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-zinc-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-zinc-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-zinc-700"></div>
            <span className="text-xs text-slate-600 dark:text-zinc-400 font-medium ml-1.5">
              Draft Preview • {primaryRecipient.recruiterName} ({primaryRecipient.companyName})
            </span>
          </div>

          <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500">
            Automated Multi-step Sequence
          </span>
        </div>

        {/* Cadence Step Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 overflow-x-auto">
          <button
            onClick={() => setActiveStepTab(1)}
            className={`flex-1 py-2.5 px-2 sm:px-3 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap min-w-0 ${
              activeStepTab === 1
                ? 'border-indigo-600 text-slate-900 dark:text-zinc-100 bg-white dark:bg-zinc-900/60 font-semibold'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-zinc-900/60'
            }`}
          >
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">1</span>
            <span className="hidden sm:inline">Step 1: Pitch (Day 0)</span>
            <span className="sm:hidden">1: Pitch</span>
          </button>

          <button
            onClick={() => setActiveStepTab(2)}
            className={`flex-1 py-2.5 px-2 sm:px-3 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap min-w-0 ${
              activeStepTab === 2
                ? 'border-indigo-600 text-slate-900 dark:text-zinc-100 bg-white dark:bg-zinc-900/60 font-semibold'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-zinc-900/60'
            }`}
          >
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">2</span>
            <span className="hidden sm:inline">Step 2: Follow-up (+{sequenceTemplates.step2?.delayDays || 3}d)</span>
            <span className="sm:hidden">2: Follow-up</span>
          </button>

          <button
            onClick={() => setActiveStepTab(3)}
            className={`flex-1 py-2.5 px-2 sm:px-3 text-xs font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap min-w-0 ${
              activeStepTab === 3
                ? 'border-indigo-600 text-slate-900 dark:text-zinc-100 bg-white dark:bg-zinc-900/60 font-semibold'
                : 'border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-zinc-900/60'
            }`}
          >
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-mono">3</span>
            <span className="hidden sm:inline">Step 3: Breakup (+{sequenceTemplates.step3?.delayDays || 4}d)</span>
            <span className="sm:hidden">3: Breakup</span>
          </button>
        </div>

        {/* Visual Sequence Pipeline Bar */}
        <div className="px-5 py-3 bg-slate-50/80 dark:bg-zinc-900/80 border-b border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-semibold text-slate-800 dark:text-zinc-200">Cadence Timeline:</span>
            <div className="flex items-center gap-1.5 font-mono text-[11px] flex-wrap">
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold border border-indigo-500/20">
                Step 1 (Day 0)
              </span>
              <span className="text-slate-400 dark:text-zinc-500 font-sans">──+{sequenceTemplates.step2?.delayDays || 3}d──&gt;</span>
              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-400 font-semibold border border-sky-500/20">
                Step 2 (Day {sequenceTemplates.step2?.delayDays || 3})
              </span>
              <span className="text-slate-400 dark:text-zinc-500 font-sans">──+{sequenceTemplates.step3?.delayDays || 4}d──&gt;</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400 font-semibold border border-purple-500/20">
                Step 3 (Day {(sequenceTemplates.step2?.delayDays || 3) + (sequenceTemplates.step3?.delayDays || 4)})
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium">
            Full Sequence Span: <strong className="text-slate-800 dark:text-zinc-200">{(sequenceTemplates.step2?.delayDays || 3) + (sequenceTemplates.step3?.delayDays || 4)} days</strong>
          </div>
        </div>

        {/* Email Editor Area */}
        <div className="p-5 space-y-4 text-xs">
          {/* Metadata bar */}
          <div className="space-y-1.5 text-slate-500 dark:text-zinc-400 pb-3 border-b border-slate-200 dark:border-zinc-800 font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-12 text-slate-400 dark:text-zinc-500 font-sans">To:</span>
              <span className="text-slate-800 dark:text-zinc-300">{primaryRecipient.recruiterName} &lt;{primaryRecipient.recruiterEmail}&gt;</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-12 text-slate-400 dark:text-zinc-500 font-sans">From:</span>
              <span className="text-slate-800 dark:text-zinc-300">{user?.smtpConfig?.senderName || user?.name || 'You'} &lt;{user?.smtpConfig?.authUser || user?.email}&gt;</span>
            </div>
          </div>

          {activeStepTab === 1 && (
            <div className="space-y-3">
              {/* Subject Line & AI Variations Optimizer */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-slate-700 dark:text-zinc-300 font-semibold text-xs">
                      Subject Line
                    </label>

                    {/* Live Subject Deliverability Diagnostics */}
                    {(() => {
                      const health = analyzeSubjectHealth(sequenceTemplates.step1.subject);
                      if (!health) return null;
                      return (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                            {health.charCount} chars • {health.wordCount} words
                          </span>
                          {health.isMobileSafe ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-medium">
                              <Smartphone className="w-2.5 h-2.5" /> Mobile Safe (&lt;50c)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-medium" title="May be cut off on smartphone email apps">
                              <Smartphone className="w-2.5 h-2.5" /> Mobile Truncated (&gt;50c)
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!showSubjectPanel && subjectVariations.length === 0) {
                        handleGenerateSubjectLines();
                      } else {
                        setShowSubjectPanel(!showSubjectPanel);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                      showSubjectPanel
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Subject Optimizer</span>
                    {subjectVariations.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20 dark:bg-white/20">
                        {subjectVariations.length}
                      </span>
                    )}
                    {showSubjectPanel ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="e.g. Full Stack Developer (3 YOE) | Aligning with [Company]'s Tech Opening"
                  value={sequenceTemplates.step1.subject}
                  onChange={(e) =>
                    setSequenceTemplates({
                      ...sequenceTemplates,
                      step1: { ...sequenceTemplates.step1, subject: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg saas-input text-xs font-medium"
                />

                {/* Spam Trigger Keyword Warnings (if any) */}
                {(() => {
                  const health = analyzeSubjectHealth(sequenceTemplates.step1.subject);
                  if (!health || health.warnings.length === 0) return null;
                  return (
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span><strong>Deliverability Notice:</strong> {health.warnings.join(' • ')}</span>
                    </div>
                  );
                })()}

                {/* Expandable AI Subject Line Variations Panel */}
                {showSubjectPanel && (
                  <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-zinc-900/90 border border-indigo-200/80 dark:border-indigo-900/50 space-y-3 animate-fadeIn mt-2">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200/80 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          High-Converting Subject Line Variations
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                          (Tested across 10,000+ tech outreach campaigns)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleGenerateSubjectLines(true)}
                        disabled={loadingSubjects}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <RotateCcw className={`w-3 h-3 ${loadingSubjects ? 'animate-spin' : ''}`} />
                        <span>{loadingSubjects ? 'Generating...' : 'Regenerate Variations'}</span>
                      </button>
                    </div>

                    {loadingSubjects && subjectVariations.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500 dark:text-zinc-400 flex flex-col items-center gap-2">
                        <Sparkles className="w-5 h-5 animate-spin text-indigo-500" />
                        <span>Crafting 5 psychological cold outreach subject lines with Gemini...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {subjectVariations.map((variant, idx) => {
                          const isActive = sequenceTemplates.step1.subject === variant.text;
                          return (
                            <div
                              key={variant.id || idx}
                              className={`p-3 rounded-lg border transition-all ${
                                isActive
                                  ? 'bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-500/50 dark:border-indigo-500/40 shadow-xs ring-1 ring-indigo-500/20'
                                  : 'bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-zinc-700'
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    {variant.badge || '⚡ High Open Rate'}
                                  </span>
                                  <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                                    {variant.category}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/40">
                                    {variant.estimatedOpenRate} Open Rate
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleCopySubject(variant.text, idx)}
                                    className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
                                    title="Copy to clipboard"
                                  >
                                    {copiedSubjectIdx === idx ? (
                                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Copied
                                      </span>
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleApplySubject(variant.text)}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                                      isActive
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-95'
                                    }`}
                                  >
                                    {isActive ? (
                                      <>
                                        <Check className="w-3 h-3" />
                                        <span>Active</span>
                                      </>
                                    ) : (
                                      <span>Apply Subject</span>
                                    )}
                                  </button>
                                </div>
                              </div>

                              <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100 font-sans tracking-tight">
                                "{variant.text}"
                              </div>

                              <div className="flex items-center justify-between flex-wrap gap-2 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-zinc-850 text-[11px] text-slate-500 dark:text-zinc-400">
                                <div className="flex items-center gap-1 text-[10px] italic">
                                  <Lightbulb className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                  <span>{variant.whyItWorks}</span>
                                </div>
                                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                                  {variant.charCount} chars • {variant.wordCount} words
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-600 dark:text-zinc-400 font-medium">Body</label>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                    Supports <code className="text-indigo-600 dark:text-indigo-400 font-semibold">[Company]</code> & <code className="text-indigo-600 dark:text-indigo-400 font-semibold">[Recruiter Name]</code>
                  </span>
                </div>
                <textarea
                  rows={9}
                  placeholder="Click 'Match JD & Draft Email' above or write your pitch here..."
                  value={sequenceTemplates.step1.body}
                  onChange={(e) =>
                    setSequenceTemplates({
                      ...sequenceTemplates,
                      step1: { ...sequenceTemplates.step1, body: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg saas-input text-xs font-sans leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeStepTab === 2 && (
            <div className="space-y-3">
              {/* Customizable Timing Control for Step 2 */}
              <div className="p-3.5 rounded-xl border border-sky-500/25 bg-sky-500/[0.04] dark:bg-sky-500/[0.06] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                      Step 2 Dispatch Interval
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/30">
                      +{sequenceTemplates.step2?.delayDays || 3} Days after Step 1
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                    Estimated dispatch: Day {sequenceTemplates.step2?.delayDays || 3}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium">Quick Presets:</span>
                  {[
                    { days: 2, label: '+2 Days', desc: 'Fast' },
                    { days: 3, label: '+3 Days', desc: 'Recommended' },
                    { days: 5, label: '+5 Days', desc: 'Relaxed' },
                  ].map((preset) => {
                    const isSelected = (sequenceTemplates.step2?.delayDays || 3) === preset.days;
                    return (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => updateStepDelay('step2', preset.days)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-sky-600 text-white font-bold shadow-xs'
                            : 'bg-white dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700'
                        }`}
                      >
                        <span>{preset.label}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-sky-100' : 'text-slate-400 dark:text-zinc-500'}`}>({preset.desc})</span>
                      </button>
                    );
                  })}

                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">Custom Days:</span>
                    <input
                      type="number"
                      min={1}
                      max={14}
                      value={sequenceTemplates.step2?.delayDays || 3}
                      onChange={(e) => updateStepDelay('step2', e.target.value)}
                      className="w-16 px-2 py-1 rounded-md saas-input text-xs font-mono text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-zinc-400 font-medium mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Re: [Subject]"
                  value={sequenceTemplates.step2.subject}
                  onChange={(e) =>
                    setSequenceTemplates({
                      ...sequenceTemplates,
                      step2: { ...sequenceTemplates.step2, subject: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg saas-input text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-zinc-400 font-medium mb-1">
                  Follow-up Body (Dispatches on Day {sequenceTemplates.step2?.delayDays || 3} if no response)
                </label>
                <textarea
                  rows={8}
                  placeholder="Polite check-in adding a key project highlight..."
                  value={sequenceTemplates.step2.body}
                  onChange={(e) =>
                    setSequenceTemplates({
                      ...sequenceTemplates,
                      step2: { ...sequenceTemplates.step2, body: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg saas-input text-xs font-sans leading-relaxed"
                />
              </div>
            </div>
          )}

          {activeStepTab === 3 && (
            <div className="space-y-3">
              {/* Customizable Timing Control for Step 3 */}
              <div className="p-3.5 rounded-xl border border-purple-500/25 bg-purple-500/[0.04] dark:bg-purple-500/[0.06] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                      Step 3 Breakup Interval
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30">
                      +{sequenceTemplates.step3?.delayDays || 4} Days after Step 2
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">
                    Total: Day {(sequenceTemplates.step2?.delayDays || 3) + (sequenceTemplates.step3?.delayDays || 4)} from launch
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium">Quick Presets:</span>
                  {[
                    { days: 3, label: '+3 Days', desc: `Day ${(sequenceTemplates.step2?.delayDays || 3) + 3}` },
                    { days: 4, label: '+4 Days', desc: 'Recommended' },
                    { days: 7, label: '+7 Days', desc: `Day ${(sequenceTemplates.step2?.delayDays || 3) + 7}` },
                  ].map((preset) => {
                    const isSelected = (sequenceTemplates.step3?.delayDays || 4) === preset.days;
                    return (
                      <button
                        key={preset.days}
                        type="button"
                        onClick={() => updateStepDelay('step3', preset.days)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-purple-600 text-white font-bold shadow-xs'
                            : 'bg-white dark:bg-zinc-850 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700'
                        }`}
                      >
                        <span>{preset.label}</span>
                        <span className={`text-[10px] ${isSelected ? 'text-purple-100' : 'text-slate-400 dark:text-zinc-500'}`}>({preset.desc})</span>
                      </button>
                    );
                  })}

                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400">Custom Days:</span>
                    <input
                      type="number"
                      min={1}
                      max={21}
                      value={sequenceTemplates.step3?.delayDays || 4}
                      onChange={(e) => updateStepDelay('step3', e.target.value)}
                      className="w-16 px-2 py-1 rounded-md saas-input text-xs font-mono text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-zinc-400 font-medium mb-1">Subject</label>
                <input
                  type="text"
                  placeholder="Re: [Subject]"
                  value={sequenceTemplates.step3.subject}
                  onChange={(e) =>
                    setSequenceTemplates({
                      ...sequenceTemplates,
                      step3: { ...sequenceTemplates.step3, subject: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg saas-input text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-zinc-400 font-medium mb-1">
                  Breakup Note Body (Dispatches on Day {(sequenceTemplates.step2?.delayDays || 3) + (sequenceTemplates.step3?.delayDays || 4)} if no response)
                </label>
                <textarea
                  rows={7}
                  placeholder="Courteous final note keeping the door open for future openings..."
                  value={sequenceTemplates.step3.body}
                  onChange={(e) =>
                    setSequenceTemplates({
                      ...sequenceTemplates,
                      step3: { ...sequenceTemplates.step3, body: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg saas-input text-xs font-sans leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Send Test to Personal Inbox Card */}
          <div className="mt-4 p-4 rounded-xl border border-indigo-200/90 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-zinc-900/60 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600 text-white mt-0.5 shadow-xs flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                    <span>Send Test Email to Myself</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
                      Testing Step {activeStepTab}
                    </span>
                    {attachResume && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 flex items-center gap-1">
                        <Paperclip className="w-2.5 h-2.5" /> PDF Attached
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">
                    Dispatches a real preview directly to your inbox so you can review layout, variable replacements, and resume attachment before contacting recruiters.
                  </p>
                </div>
              </div>

              {/* Target & Action */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <input
                  type="email"
                  placeholder={user?.smtpConfig?.authUser || user?.email || 'your-email@gmail.com'}
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full sm:w-56 px-3 py-1.5 text-xs rounded-lg saas-input font-mono"
                  title="Destination inbox for test preview email"
                />

                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={sendingTest}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer whitespace-nowrap active:scale-95"
                >
                  {sendingTest ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Test...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Test</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Test Email Result Banner */}
            {testResult && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center justify-between gap-2 border animate-in fade-in duration-200 ${
                  testResult.success
                    ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                  )}
                  <span>
                    {testResult.message}
                    {testResult.hasAttachment && (
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300 ml-1">
                        (Attachment: {testResult.attachmentName})
                      </span>
                    )}
                  </span>
                </div>

                {testResult.requiresSmtp && (
                  <button
                    type="button"
                    onClick={() => navigate('/settings')}
                    className="underline font-semibold hover:text-rose-950 dark:hover:text-white ml-2 flex-shrink-0 flex items-center gap-1"
                  >
                    <span>Configure Mailbox</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Launch Action */}
        <div className="p-4 bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-600 dark:text-zinc-400">
            <span>
              Recipients queued: <strong className="text-slate-900 dark:text-zinc-200">{selectedContacts.length}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              Resume Attachment:{' '}
              <strong className={attachResume ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}>
                {attachResume ? 'Active (PDF)' : 'Disabled'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={sendingTest}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-700 font-semibold text-xs transition-all shadow-xs disabled:opacity-50 cursor-pointer flex-1 sm:flex-none"
              title="Dispatches a live preview of the current active step to your email"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              <span>{sendingTest ? 'Sending...' : 'Test Email'}</span>
            </button>

            <button
              onClick={handleLaunchCampaign}
              disabled={launching}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer flex-1 sm:flex-none"
            >
              {launching ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Launch Cadence</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
