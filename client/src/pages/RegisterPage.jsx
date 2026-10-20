import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/Logo';
import {
  User,
  Mail,
  Lock,
  Briefcase,
  Globe,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Sun,
  Moon,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  Users,
  CheckCircle2,
  Activity,
  Check,
  Shield,
  Zap,
} from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [targetRole, setTargetRole] = useState('Staff / Principal Systems Engineer');
  const [customSlug, setCustomSlug] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoActive, setDemoActive] = useState(false);

  // Auto-generate slug from name if customSlug is empty
  const computedSlug = customSlug || (name ? name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 24) : 'workspace');

  // Password entropy & security meter
  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'Password required', color: 'bg-slate-300 dark:bg-zinc-700' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[0-9]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd) || /[A-Z]/.test(pwd)) score++;

    if (score <= 1) return { score: 1, label: 'Weak (add numbers & symbols)', color: 'bg-rose-500' };
    if (score === 2) return { score: 2, label: 'Fair (length ≥ 8 recommended)', color: 'bg-amber-500' };
    if (score === 3) return { score: 3, label: 'Good (strong entropy)', color: 'bg-cyan-500' };
    return { score: 4, label: 'Strong: Entropy Verified', color: 'bg-emerald-500' };
  };

  const strength = calculateStrength(password);

  const handleFillSample = () => {
    const randomId = Math.floor(1000 + Math.random() * 9000);
    setName('Alex Morgan');
    setEmail(`alex.morgan.${randomId}@techreachly.dev`);
    setPassword('SecureReachly2026!');
    setTargetRole('Staff / Principal Systems Engineer');
    setCustomSlug(`alex-morgan-${randomId}`);
    setAgreedToTerms(true);
    setDemoActive(true);
    setTimeout(() => setDemoActive(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to create your workspace.');
      return;
    }
    setError('');
    setLoading(true);

    const res = await register(name, email, password);
    if (res.success) {
      navigate('/resume');
    } else {
      setError(res.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen saas-bg text-slate-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white transition-colors duration-200 overflow-x-hidden w-full max-w-full">
      {/* Top Status & Telemetry Header Bar */}
      <header className="w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md px-4 sm:px-8 py-2.5 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400">
              SYSTEM HEALTH: 99.98% OPERATIONAL
            </span>
          </div>
          <span className="hidden md:inline-block text-slate-300 dark:text-zinc-700">•</span>
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
            Cluster: <span className="font-mono text-slate-700 dark:text-zinc-300">us-east-1</span> (14ms latency)
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>SOC-2 Type II Certified</span>
          </div>

          <div className="h-3.5 w-[1px] bg-slate-200 dark:border-zinc-800 hidden sm:block" />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform duration-200" />
            )}
          </button>
        </div>
      </header>

      {/* Main Two-Column Split Architecture */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* LEFT SHOWCASE: Brand Identity, Roadmap & Authority Proof (~58% / 7 cols) */}
        <section className="lg:col-span-7 flex flex-col justify-center relative p-6 sm:p-10 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-xl overflow-hidden [contain:paint] isolate group">
          {/* Ambient Lighting Gradients */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-500/15 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-reach-ambient" />
          <div
            className="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-reach-ambient"
            style={{ animationDelay: '-2s' }}
          />

          {/* Top Badge & Uptime */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 text-xs font-semibold tracking-wide text-slate-800 dark:text-zinc-200 shadow-xs">
              <Zap className="w-3.5 h-3.5 text-cyan-500 fill-cyan-500" />
              <span>Algorithmic Talent Engagement • v2.4</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900 px-2.5 py-1 rounded border border-slate-200 dark:border-zinc-800">
              INSTANT ACTIVATION
            </span>
          </div>

          {/* Brand Logo Hero Lockup */}
          <div className="relative z-10 mb-6">
            <Logo variant="full" size="md" showBadge={true} badgeText="v1.0" />
            <p className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 tracking-wider mt-2 flex items-center gap-1.5 uppercase font-medium">
              <Activity className="w-3.5 h-3.5" />
              <span>High-Velocity Workspace Setup Engine</span>
            </p>
          </div>

          {/* Headline & Value Proposition */}
          <div className="relative z-10 space-y-3 mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Supercharge your career trajectory with{' '}
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                Autonomous Outreach
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-xl">
              Surgically bridge software engineers with tier-1 venture and enterprise hiring leads.
              Bypass recruiter noise with verified direct-inbox routing and telemetry-backed match intelligence.
            </p>
          </div>

          {/* Live Telemetry Bento Grid Cards */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
            {/* Metric Card 1 */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/80 relative overflow-hidden group/card hover:border-cyan-500/40 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Deliverability</span>
                <CheckCircle2 className="w-4 h-4 text-cyan-500" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                98.4%
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-cyan-600 dark:text-cyan-400 font-medium">
                <Sparkles className="w-3 h-3" />
                <span>Zero spam flags</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-b-xl" />
            </div>

            {/* Metric Card 2 */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/80 relative overflow-hidden group/card hover:border-purple-500/40 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Response Rate</span>
                <TrendingUp className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                3.4x
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                <Activity className="w-3 h-3" />
                <span>vs. cold LinkedIn</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-500 rounded-b-xl" />
            </div>

            {/* Metric Card 3 */}
            <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/80 relative overflow-hidden group/card hover:border-indigo-500/40 transition-all duration-300">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Active Partners</span>
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                2,400+
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                <ShieldCheck className="w-3 h-3" />
                <span>Top Tier-1 firms</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-b-xl" />
            </div>
          </div>

          {/* Autonomous Setup Sequence Roadmap (3 Milestones) */}
          <div className="relative z-10 space-y-2.5 mb-8">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-semibold flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span>3-Minute Autonomous Setup Sequence</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  01
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Identity & Role Graph Verification</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Target seniority, desired compensation, and verified GitHub stack</div>
                </div>
              </div>
              <span className="font-mono text-[10px] text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                Auto-Sync
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                  02
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">AI Pitch Synthesizer Calibration</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Adaptive copywriting tuned to 4 distinct hiring persona tones</div>
                </div>
              </div>
              <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                Gemini 3.5
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">
                  03
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Direct-to-Inbox Lead Pipeline Live</div>
                  <div className="text-[11px] text-slate-500 dark:text-zinc-400">Automated warm cadences routed directly to hiring decision makers</div>
                </div>
              </div>
              <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Ready
              </span>
            </div>
          </div>

          {/* Candidate Proof Card */}
          <div className="relative z-10 p-4 rounded-xl bg-slate-50/90 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 flex items-start gap-3.5">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs shadow-md">
                ER
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-cyan-400 border-2 border-white dark:border-zinc-900 rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">Elena Rostova</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                    Staff Systems Architect
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">Matched 11d ago</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 italic">
                "TechReachly's adaptive pitch synthesizer secured 4 Tier-1 interviews in less than two weeks without sending a single cold manual email."
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-[11px] text-slate-500 dark:text-zinc-400">
                <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-medium whitespace-nowrap">
                  <CheckCircle2 className="w-3 h-3" /> 4 Offers Pending
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="break-words">Stripe, Datadog, Snowflake Sourcing Leads</span>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT AUTHENTICATION PANEL: Conversion-Optimized Workspace Setup (~42% / 5 cols) */}
        <section className="lg:col-span-5 w-full flex flex-col justify-center min-w-0">
          <div className="w-full bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 md:p-9 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
            {/* Top Multi-Stop Gradient Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400" />

            {/* Card Header */}
            <div className="mb-6 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  Instant Workspace Setup
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                  14-Day Free Access
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Create your workspace
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                Start autonomous outreach in under 2 minutes. No credit card required.
              </p>
            </div>

            {/* 1-Click Fast Fill & Sandbox Access */}
            <div className="space-y-2.5 mb-5">
              {/* 1-Click Fast Sample Fill */}
              <button
                type="button"
                onClick={handleFillSample}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 group ${
                  demoActive
                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-600 dark:text-cyan-300'
                    : 'border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 hover:border-indigo-500/60 text-slate-800 dark:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-500 group-hover:rotate-12 transition-transform" />
                  <span>1-Click Sample Workspace Setup</span>
                </div>
                <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-white dark:bg-zinc-950 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800">
                  {demoActive ? 'Sample Applied!' : 'Auto-fill'}
                </span>
              </button>

              {/* Fast Social Sign-In Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-medium transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path
                      d="M12 5c1.56 0 2.96.54 4.07 1.43l3.05-3.05C17.27 1.63 14.81 1 12 1 7.46 1 3.59 3.58 1.66 7.36l3.69 2.86C6.23 7.33 8.87 5 12 5z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-2 3.72-4.94 3.72-8.69z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.35 14.78c-.24-.72-.37-1.49-.37-2.28s.13-1.56.37-2.28L1.66 7.36C.6 9.47 0 11.66 0 14s.6 4.53 1.66 6.64l3.69-2.86z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.08.72-2.45 1.16-4.23 1.16-3.13 0-5.77-2.33-6.65-5.22L1.66 16c1.93 3.78 5.8 6.36 10.34 6.36z"
                      fill="#34A853"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleFillSample}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-xl text-xs font-medium transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path
                      clipRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      fillRule="evenodd"
                    />
                  </svg>
                  <span>GitHub</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
              </div>
              <span className="relative px-3 bg-white dark:bg-zinc-900 text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                Or register with technical credentials
              </span>
            </div>

            {/* Form & Alerts */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {/* Full Name Input */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-zinc-300 font-medium">Full Legal Name</label>
                <div className="relative group">
                  <User className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-500 transition-colors" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-xs"
                  />
                </div>
              </div>

              {/* Work Email Address Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-zinc-300 font-medium">Work / Primary Email</label>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500">name@domain.com</span>
                </div>
                <div className="relative group">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-500 transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="alex@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-12 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-xs"
                  />
                  <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-slate-400 dark:text-zinc-600 bg-slate-200/60 dark:bg-zinc-800/60 px-1.5 py-0.5 rounded">
                    ⌘K
                  </span>
                </div>
              </div>

              {/* Target Engineering Role Selector */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-zinc-300 font-medium flex items-center justify-between">
                  <span>Target Engineering Focus</span>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">Match Tuning</span>
                </label>
                <div className="relative group">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-purple-500 transition-colors pointer-events-none" />
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-xs appearance-none cursor-pointer"
                  >
                    <option value="Staff / Principal Systems Engineer">Staff / Principal Systems Engineer</option>
                    <option value="AI/ML Infrastructure Lead">AI/ML Infrastructure Lead</option>
                    <option value="Distributed Backend Architect">Distributed Backend Architect</option>
                    <option value="Founding Full-Stack Engineer">Founding Full-Stack Engineer</option>
                    <option value="Frontend & UI/UX Specialist">Frontend & UI/UX Specialist</option>
                    <option value="DevOps & Cloud Systems Architect">DevOps & Cloud Systems Architect</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-zinc-500">
                    ▼
                  </div>
                </div>
              </div>

              {/* Workspace URL Slug Preview */}
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-zinc-300 font-medium flex items-center justify-between">
                  <span>Dedicated Workspace Domain</span>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">Custom URL</span>
                </label>
                <div className="relative group flex items-center rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all">
                  <div className="pl-3 pr-1 text-slate-400 dark:text-zinc-500 flex items-center">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 dark:text-zinc-500 pl-1">techreachly.ai/w/</span>
                  <input
                    type="text"
                    value={customSlug || (name ? name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 20) : '')}
                    onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="my-workspace"
                    className="flex-1 pr-3 py-2 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none text-xs font-mono"
                  />
                </div>
              </div>

              {/* Password Input & Entropy Meter */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 dark:text-zinc-300 font-medium">Password</label>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">Min 8 chars</span>
                </div>
                <div className="relative group">
                  <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Password Strength 4-Segment Bar */}
                {password && (
                  <div className="pt-1.5 space-y-1 animate-in fade-in">
                    <div className="grid grid-cols-4 gap-1.5 h-1 w-full">
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 1 ? strength.color : 'bg-slate-200 dark:bg-zinc-800'}`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 2 ? strength.color : 'bg-slate-200 dark:bg-zinc-800'}`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 3 ? strength.color : 'bg-slate-200 dark:bg-zinc-800'}`} />
                      <div className={`h-full rounded-full transition-all duration-300 ${strength.score >= 4 ? strength.color : 'bg-slate-200 dark:bg-zinc-800'}`} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500 dark:text-zinc-400">Security rating:</span>
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">{strength.label}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Terms & Privacy Policy Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 rounded bg-slate-50 dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-600 dark:text-zinc-400 leading-tight">
                    I agree to TechReachly's{' '}
                    <a href="#terms" onClick={(e) => e.preventDefault()} className="text-cyan-600 dark:text-cyan-400 hover:underline">
                      Terms of Service
                    </a>
                    ,{' '}
                    <a href="#privacy" onClick={(e) => e.preventDefault()} className="text-cyan-600 dark:text-cyan-400 hover:underline">
                      Privacy Policy
                    </a>
                    , and Enterprise DPA.
                  </span>
                </label>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right transition-all duration-300 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group/btn disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Provisioning Workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Free Workspace & Begin</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
                <p className="text-center text-[10px] text-slate-400 dark:text-zinc-500 mt-2">
                  Instant activation • 14-day full access • Cancel anytime
                </p>
              </div>
            </form>

            {/* Compliance Trust Badges */}
            <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-zinc-800/80 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-[11px] text-slate-400 dark:text-zinc-500">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-500" />
                <span>256-Bit TLS</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-500" />
                <span>SOC2 Type II</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Check className="w-3 h-3 text-indigo-500" />
                <span>GDPR Safe</span>
              </div>
            </div>

            {/* Sign In Callout Link */}
            <div className="mt-4 text-center text-xs text-slate-500 dark:text-zinc-400">
              Already have an enterprise workspace?{' '}
              <Link
                to="/login"
                className="text-indigo-600 dark:text-cyan-400 font-semibold hover:underline"
              >
                Sign in to TechReachly
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Note */}
      <footer className="w-full border-t border-slate-200/80 dark:border-zinc-900 py-4 px-6 text-center text-[11px] text-slate-400 dark:text-zinc-600">
        TechReachly • Precision Intelligence v2.4 • All Rights Reserved
      </footer>
    </div>
  );
};
