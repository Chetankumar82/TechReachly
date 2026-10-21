import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo, { LogoSquircle } from '../components/Logo';
import api from '../services/api';
import {
  Mail,
  Lock,
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
  X,
} from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoActive, setDemoActive] = useState(false);

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@techreachly.com');
    setPassword('Password123!');
    setDemoActive(true);
    setTimeout(() => setDemoActive(false), 2000);
  };

  const handleFillAdminDemo = () => {
    setEmail('admin@techreachly.com');
    setPassword('Password123!');
    setDemoActive(true);
    setTimeout(() => setDemoActive(false), 2000);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      return setForgotMessage({ text: 'Please enter your email address.', type: 'error' });
    }
    setForgotLoading(true);
    setForgotMessage({ text: '', type: '' });
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      if (res.data?.success) {
        setForgotMessage({
          text: res.data.message || 'If an account exists, a reset link has been sent to your email.',
          type: 'success',
        });
      } else {
        setForgotMessage({ text: res.data?.message || 'Something went wrong.', type: 'error' });
      }
    } catch (err) {
      setForgotMessage({ text: err.response?.data?.message || 'Failed to send reset email.', type: 'error' });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen lg:max-h-screen saas-bg text-slate-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white transition-colors duration-200 overflow-x-hidden lg:overflow-hidden w-full max-w-full">
      {/* 1. Top Status & Telemetry Header Bar: Fixed 44px */}
      <header className="w-full h-11 border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md px-4 sm:px-6 z-40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
            </span>
            <span className="font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400 truncate">
              PRECISION CLUSTER v2.4
            </span>
          </div>
          <span className="hidden md:inline-block text-slate-300 dark:text-zinc-700">•</span>
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 truncate">
            Node: <span className="font-mono text-slate-700 dark:text-zinc-300">us-east.reachly.ai</span> (14ms latency)
          </span>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>SOC-2 Type II Certified</span>
          </div>

          <div className="h-3.5 w-[1px] bg-slate-200 dark:border-zinc-800 hidden sm:block" />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-200" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform duration-200" />
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Hero Section: Fits 100% inside available viewport height on desktop, scrolls naturally on mobile */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5 lg:py-2 flex items-center justify-center min-h-0 overflow-y-auto lg:overflow-hidden">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
          {/* LEFT SHOWCASE: Brand Identity, Telemetry & Social Proof (~56% / 7 cols) - Desktop only */}
          <section className="hidden lg:flex lg:col-span-7 flex-col justify-center relative p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-xl overflow-hidden [contain:paint] isolate group">
            {/* Ambient Lighting Gradients */}
            <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-500/15 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none animate-reach-ambient" />
            <div
              className="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-reach-ambient"
              style={{ animationDelay: '-2s' }}
            />

            {/* Top Badge & Uptime */}
            <div className="relative z-10 flex items-center justify-between mb-2.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/90 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 text-[11px] font-semibold text-slate-800 dark:text-zinc-200">
                <Zap className="w-3 h-3 text-cyan-500 fill-cyan-500" />
                <span>Algorithmic Talent Engagement</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-900 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-800">
                99.98% UPTIME
              </span>
            </div>

            {/* Brand Logo & Headline */}
            <div className="relative z-10 mb-2.5">
              <Logo variant="full" size="sm" showBadge={true} badgeText="v2.4" />
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1.5 leading-tight">
                Supercharge your career trajectory with{' '}
                <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                  Autonomous Outreach
                </span>
              </h1>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1 line-clamp-2">
                Surgically bridge software engineers with tier-1 venture and enterprise hiring leads.
                Bypass recruiter noise with verified direct-inbox routing and telemetry-backed match intelligence.
              </p>
            </div>

            {/* Bento Metric Cards (Compact 3-Column Single Row) */}
            <div className="relative z-10 grid grid-cols-3 gap-2.5 mb-2.5">
              <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/80 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Deliverability</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">98.4%</div>
                <div className="text-[10px] text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> Zero spam flags
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-400" />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/80 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Response Rate</span>
                  <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">3.4x</div>
                <div className="text-[10px] text-purple-600 dark:text-purple-400 flex items-center gap-0.5">
                  <Activity className="w-2.5 h-2.5" /> vs cold LinkedIn
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-500" />
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800/80 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-medium">Active Partners</span>
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">2,400+</div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" /> Top Tier-1 firms
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-cyan-400" />
              </div>
            </div>

            {/* Candidate Proof Card */}
            <div className="relative z-10 p-2.5 rounded-xl bg-slate-50/90 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
                ER
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">Elena Rostova</span>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 shrink-0">
                    Staff Architect
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 italic truncate">
                  "TechReachly secured 4 Tier-1 interviews in less than two weeks without manual cold emails."
                </p>
              </div>
            </div>
          </section>

          {/* RIGHT AUTHENTICATION PANEL: High Conversion Form (~44% / 5 cols) */}
          <section className="lg:col-span-5 w-full max-w-md mx-auto flex flex-col justify-center min-w-0">
            {/* Mobile-Only Brand Header */}
            <div className="lg:hidden text-center mb-3">
              <div className="flex justify-center mb-1.5">
                <Logo variant="full" size="sm" showBadge={true} badgeText="v2.4" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                Autonomous Recruiter Outreach & Telemetry Gateway
              </p>
            </div>

            <div className="w-full bg-white dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
              {/* Top Multi-Stop Gradient Accent Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400" />

              {/* Card Header */}
              <div className="mb-2.5 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    Secure Auth Gateway
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700">
                    v2.4 LTS
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Welcome back
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  Log in to manage candidate pipelines & outreach telemetry.
                </p>
              </div>

              {/* 1-Click Fast Auth & Demo Access */}
              <div className="space-y-2 mb-2.5">
                {/* 1-Click Fast Auth & Demo Access */}
                <div className="grid grid-cols-2 gap-2 mb-2.5">
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:border-indigo-500/60 text-slate-800 dark:text-zinc-200 text-[11px] font-semibold transition-all group cursor-pointer"
                    title="Fill candidate demo account (demo@techreachly.com)"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">Candidate Demo</span>
                    </div>
                    <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 bg-white dark:bg-zinc-950 px-1 py-0.2 rounded border border-slate-200 dark:border-zinc-800 shrink-0">
                      Auto
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFillAdminDemo}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 hover:border-cyan-500/60 text-slate-800 dark:text-zinc-200 text-[11px] font-semibold transition-all group cursor-pointer"
                    title="Fill admin moderation account (admin@techreachly.com)"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      <span className="truncate">Admin Demo</span>
                    </div>
                    <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 bg-white dark:bg-zinc-950 px-1 py-0.2 rounded border border-slate-200 dark:border-zinc-800 shrink-0">
                      Auto
                    </span>
                  </button>
                </div>

                {/* Fast Social Sign-In Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
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
                    onClick={handleFillDemo}
                    className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-medium transition-colors"
                  >
                    <svg className="w-3 h-3 fill-current shrink-0" viewBox="0 0 24 24">
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
              <div className="relative flex items-center justify-center my-2.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-zinc-800" />
                </div>
                <span className="relative px-2.5 bg-white dark:bg-zinc-900 text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                  Or continue with email
                </span>
              </div>

              {/* Form & Alerts */}
              {error && (
                <div className="mb-2.5 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-1.5 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
                {/* Email Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="text-slate-700 dark:text-zinc-300 font-medium truncate">Work Email</label>
                    <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500">name@domain.com</span>
                  </div>
                  <div className="relative group">
                    <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-500 transition-colors" />
                    <input
                      type="email"
                      required
                      placeholder="demo@techreachly.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all text-xs"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <label className="text-slate-700 dark:text-zinc-300 font-medium truncate">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email || '');
                        setForgotMessage({ text: '', type: '' });
                        setShowForgotModal(true);
                      }}
                      className="text-[10px] text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-8 pr-9 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-0.5 text-[11px] gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none min-w-0 truncate">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded bg-slate-50 dark:bg-zinc-950 border-slate-300 dark:border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer shrink-0"
                    />
                    <span className="text-[11px] text-slate-600 dark:text-zinc-400 truncate">
                      Remember terminal for 30 days
                    </span>
                  </label>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500 shrink-0">2FA: Ready</span>
                </div>

                {/* Submit CTA Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right transition-all duration-300 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group/btn disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Authenticating Workspace...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to TechReachly</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Compliance Trust Badges */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-zinc-800/80 flex items-center justify-center gap-2 sm:gap-3 text-[10px] text-slate-400 dark:text-zinc-500">
                <div className="flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-cyan-500" />
                  <span>256-Bit</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-purple-500" />
                  <span>SOC2</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Check className="w-2.5 h-2.5 text-indigo-500" />
                  <span>GDPR Safe</span>
                </div>
              </div>

              {/* Registration Callout Link */}
              <div className="mt-2 text-center text-[11px] text-slate-500 dark:text-zinc-400">
                Don't have an enterprise workspace?{' '}
                <Link
                  to="/register"
                  className="text-indigo-600 dark:text-cyan-400 font-semibold hover:underline"
                >
                  Start 14-day free trial →
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* 3. Footer Bar: Fixed 32px */}
      <footer className="w-full h-8 border-t border-slate-200/80 dark:border-zinc-900 px-6 text-center text-[11px] text-slate-400 dark:text-zinc-600 flex items-center justify-center shrink-0">
        TechReachly • Precision Intelligence v2.4 • All Rights Reserved
      </footer>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reset Your Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 leading-relaxed">
              Enter your registered work email address. If an account is found, we'll dispatch a secure reset link valid for 15 minutes.
            </p>

            {forgotMessage.text && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                  forgotMessage.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400'
                }`}
              >
                {forgotMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                )}
                <span>{forgotMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 dark:text-zinc-300 font-medium">Work Email Address</label>
                <div className="relative group">
                  <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-500 transition-colors" />
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:opacity-95 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {forgotLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
