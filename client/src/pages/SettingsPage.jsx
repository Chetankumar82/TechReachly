import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Logo, { LogoSquircle } from '../components/Logo';
import {
  Key,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Save,
  Server,
  Sliders,
  ExternalLink,
  X,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Activity,
  Globe,
  RefreshCw,
  AlertTriangle,
  MailCheck,
  ShieldAlert,
  Palette,
  Download,
} from 'lucide-react';

export const SettingsPage = () => {
  const { user, updateUser } = useAuth();

  const [smtp, setSmtp] = useState({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    authUser: '',
    authPass: '',
    senderName: '',
  });

  const [dailyLimit, setDailyLimit] = useState(25);
  const [geminiApiKey, setGeminiApiKey] = useState('');

  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [loadedInitially, setLoadedInitially] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const [testResult, setTestResult] = useState(null);
  const [geminiTestResult, setGeminiTestResult] = useState(null);
  const [auditing, setAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Initialize form fields once user data is available, preserving all saved credentials
  useEffect(() => {
    if (user && !loadedInitially) {
      if (user.smtpConfig) {
        setSmtp({
          host: user.smtpConfig.host || 'smtp.gmail.com',
          port: user.smtpConfig.port || 465,
          secure: user.smtpConfig.secure !== undefined ? user.smtpConfig.secure : true,
          authUser: user.smtpConfig.authUser || user.email || '',
          authPass: user.smtpConfig.authPass || '',
          senderName: user.smtpConfig.senderName || user.name || '',
        });
      }
      if (user.outreachSettings?.dailyLimit) {
        setDailyLimit(user.outreachSettings.dailyLimit);
      }
      if (user.geminiApiKey) {
        setGeminiApiKey(user.geminiApiKey);
      }
      setLoadedInitially(true);
    }
  }, [user, loadedInitially]);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await api.post('/auth/smtp/test', smtp);
      setTestResult(res.data);
      if (res.data?.success) {
        updateUser({
          smtpConfig: {
            ...user?.smtpConfig,
            ...smtp,
            verified: true,
            lastVerifiedAt: new Date(),
          },
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || 'SMTP Connection test failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRunDeliverabilityAudit = async () => {
    setAuditing(true);
    setAuditResult(null);

    try {
      const res = await api.post('/auth/smtp/audit', smtp);
      if (res.data?.success) {
        setAuditResult(res.data.data);
        if (res.data.data?.smtpVerified) {
          updateUser({
            smtpConfig: {
              ...user?.smtpConfig,
              ...smtp,
              verified: true,
              lastVerifiedAt: new Date(),
            },
          });
        }
      }
    } catch (err) {
      setAuditResult({
        totalScore: 25,
        grade: 'F',
        smtpVerified: false,
        smtpMessage: err.response?.data?.message || 'Failed to complete deliverability audit',
        mx: { status: 'failed', score: 0 },
        spf: { status: 'failed', score: 0 },
        dmarc: { status: 'failed', score: 0 },
        volumeSafety: { status: 'warning', score: 5 },
        recommendations: [
          {
            type: 'critical',
            title: 'Audit Connection Failed',
            message: err.response?.data?.message || 'Check your internet connection and verify SMTP port settings.',
          },
        ],
      });
    } finally {
      setAuditing(false);
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiTestResult(null);

    try {
      const res = await api.post('/auth/gemini/test', { geminiApiKey });
      setGeminiTestResult(res.data);
    } catch (err) {
      setGeminiTestResult({
        success: false,
        message: err.response?.data?.message || 'Gemini API test failed',
      });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    setJustSaved(false);

    try {
      const res = await api.put('/auth/smtp', {
        ...smtp,
        dailyLimit,
        geminiApiKey,
      });

      if (res.data?.success) {
        const updatedUser = res.data.data;
        updateUser(updatedUser);

        // Explicitly maintain current form fields with saved values
        setSmtp({
          host: updatedUser.smtpConfig?.host || smtp.host || 'smtp.gmail.com',
          port: updatedUser.smtpConfig?.port || smtp.port || 465,
          secure: updatedUser.smtpConfig?.secure ?? smtp.secure ?? true,
          authUser: updatedUser.smtpConfig?.authUser || smtp.authUser || '',
          authPass: updatedUser.smtpConfig?.authPass || smtp.authPass || '',
          senderName: updatedUser.smtpConfig?.senderName || smtp.senderName || '',
        });
        setGeminiApiKey(updatedUser.geminiApiKey ?? geminiApiKey);
        setDailyLimit(updatedUser.outreachSettings?.dailyLimit ?? dailyLimit);

        setJustSaved(true);
        setMessage({ text: 'All credentials and settings saved and preserved successfully!', type: 'success' });

        // Reset justSaved indicator after 3 seconds
        setTimeout(() => {
          setJustSaved(false);
        }, 3000);

        // Auto-dismiss message after 5 seconds
        setTimeout(() => {
          setMessage({ text: '', type: '' });
        }, 5000);
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to save settings',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl relative">
      {/* Page Header */}
      <div className="pb-2">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings & Configurations
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
          Configure Google Gemini AI models, custom SMTP mailbox credentials, and daily deliverability limits.
        </p>
      </div>

      {/* Top Banner Alert (if present) */}
      {message.text && (
        <div
          className={`p-3.5 rounded-lg flex items-center justify-between gap-2.5 text-xs border animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage({ text: '', type: '' })}
            className="text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Google Gemini AI Configuration Card */}
        <div className="saas-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Google Gemini AI Model Engine
              </h2>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white font-medium inline-flex items-center gap-1 transition-colors"
            >
              Get Free Key from Google AI Studio <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
            Powers resume section extraction, Job Description (JD) matching, and 3-step personalized cold outreach cadences.
          </p>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <label className="block text-slate-700 dark:text-zinc-300 font-medium">Gemini API Key</label>
              {geminiApiKey && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  <Check className="w-3 h-3" /> Key Saved in DB ({geminiApiKey.length} chars)
                </span>
              )}
            </div>
            <div className="relative">
              <Key className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showGeminiKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full pl-8 pr-10 py-1.5 rounded-lg saas-input text-xs font-mono"
              />
              <button
                type="button"
                onClick={() => setShowGeminiKey(!showGeminiKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white p-1 transition-colors"
                title={showGeminiKey ? 'Hide key' : 'Show key'}
              >
                {showGeminiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400">
              Your key is preserved securely. Click the eye icon anytime to view or edit.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleTestGemini}
              disabled={testingGemini || !geminiApiKey}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {testingGemini ? 'Testing Key...' : 'Test AI Connection'}
            </button>

            {geminiTestResult && (
              <div
                className={`text-xs flex items-center gap-1.5 ${
                  geminiTestResult.success ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {geminiTestResult.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                <span>{geminiTestResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Outgoing Mailbox (SMTP) */}
        <div className="saas-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-zinc-800">
            <Server className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Outgoing Mailbox (SMTP) Credentials
            </h2>
          </div>

          {/* Gmail App Password Tip */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-zinc-200">
              <HelpCircle className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              Gmail / Google Workspace Setup
            </div>
            <p className="text-[11px] leading-relaxed">
              Google accounts require a <strong>16-character App Password</strong> (from Google Account &gt; Security &gt; 2-Step Verification &gt; App Passwords).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">Sender Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Kumar"
                value={smtp.senderName}
                onChange={(e) => setSmtp({ ...smtp, senderName: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">Email Address</label>
              <input
                type="email"
                placeholder="you@gmail.com"
                value={smtp.authUser}
                onChange={(e) => setSmtp({ ...smtp, authUser: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">SMTP Host</label>
              <input
                type="text"
                placeholder="smtp.gmail.com"
                value={smtp.host}
                onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">SMTP Port</label>
              <input
                type="number"
                placeholder="465"
                value={smtp.port}
                onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-lg saas-input text-xs font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 dark:text-zinc-300 font-medium">
                  16-Character Google App Password
                </label>
                {smtp.authPass ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-medium">
                    <Check className="w-3 h-3" /> Password Saved ({smtp.authPass.replace(/\s+/g, '').length} chars)
                  </span>
                ) : user?.smtpConfig?.authPass ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-medium">
                    <Check className="w-3 h-3" /> Password Stored in DB
                  </span>
                ) : null}
              </div>
              <div className="relative">
                <input
                  type={showSmtpPass ? 'text' : 'password'}
                  placeholder="xxxx xxxx xxxx xxxx"
                  value={smtp.authPass}
                  onChange={(e) => setSmtp({ ...smtp, authPass: e.target.value })}
                  className="w-full pl-3 pr-10 py-1.5 rounded-lg saas-input text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowSmtpPass(!showSmtpPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white p-1 transition-colors"
                  title={showSmtpPass ? 'Hide password' : 'Show password'}
                >
                  {showSmtpPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1">
                Your password stays saved here. Click the eye icon anytime to view and confirm it.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleRunDeliverabilityAudit}
                disabled={auditing || !smtp.authUser}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
              >
                <ShieldCheck className={`w-3.5 h-3.5 ${auditing ? 'animate-spin' : ''}`} />
                <span>{auditing ? 'Running Deliverability Audit...' : 'Run Full Deliverability Audit'}</span>
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !smtp.authUser}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
              >
                {testing ? 'Testing SMTP...' : 'Quick SMTP Ping'}
              </button>
            </div>

            {testResult && (
              <div
                className={`text-xs flex items-center gap-1.5 ${
                  testResult.success ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Deliverability Health Audit Card */}
          {auditResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50/80 dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 space-y-4 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shadow-xs ${
                    auditResult.totalScore >= 85
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : auditResult.totalScore >= 65
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                  }`}>
                    {auditResult.grade}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                        Deliverability Health Score: {auditResult.totalScore}/100
                      </h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        auditResult.totalScore >= 85
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : auditResult.totalScore >= 65
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {auditResult.totalScore >= 95 ? 'Elite Inbox Deliverability' : auditResult.totalScore >= 85 ? 'Optimal Primary Inbox' : auditResult.totalScore >= 65 ? 'Good — Minor Fixes Needed' : 'Spam Folder Risk'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                      Domain: <strong className="text-slate-800 dark:text-zinc-200 font-mono">{auditResult.domain}</strong> • Real-time DNS & Mailbox Telemetry
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunDeliverabilityAudit}
                  disabled={auditing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 shadow-xs transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${auditing ? 'animate-spin' : ''}`} />
                  <span>{auditing ? 'Re-auditing...' : 'Re-Run Audit'}</span>
                </button>
              </div>

              {/* Technical 5-Pillar Diagnostics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                {/* 1. SMTP Handshake */}
                <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Server className="w-3.5 h-3.5" /> SMTP Handshake
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                      {auditResult.handshake.score}/35
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-zinc-100 text-xs">
                    {auditResult.smtpVerified ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    )}
                    <span>{auditResult.smtpVerified ? 'Authenticated (SSL/TLS)' : 'Auth Failed'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate" title={auditResult.smtpMessage}>
                    {auditResult.smtpMessage}
                  </p>
                </div>

                {/* 2. DNS MX Inbound */}
                <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <MailCheck className="w-3.5 h-3.5" /> DNS MX Records
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                      {auditResult.mx.score}/20
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-zinc-100 text-xs">
                    {auditResult.mx.status === 'passed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>{auditResult.mx.status === 'passed' ? 'Valid Mail Exchanger' : 'Missing / Incomplete MX'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono truncate" title={auditResult.mx.records?.join(', ')}>
                    {auditResult.mx.records?.length > 0 ? auditResult.mx.records.join(', ') : 'No records'}
                  </p>
                </div>

                {/* 3. SPF Record */}
                <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> SPF Anti-Spam
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                      {auditResult.spf.score}/20
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-zinc-100 text-xs">
                    {auditResult.spf.status === 'passed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>{auditResult.spf.status === 'passed' ? 'SPF Configured & Passing' : 'Missing SPF Record'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono truncate" title={auditResult.spf.record}>
                    {auditResult.spf.record || 'No SPF record found'}
                  </p>
                </div>

                {/* 4. DMARC Policy */}
                <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" /> DMARC Anti-Spoofing
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                      {auditResult.dmarc.score}/15
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-zinc-100 text-xs">
                    {auditResult.dmarc.status === 'passed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>{auditResult.dmarc.status === 'passed' ? 'DMARC Active' : 'Default / None'}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-mono truncate" title={auditResult.dmarc.record}>
                    {auditResult.dmarc.record || 'No DMARC record'}
                  </p>
                </div>

                {/* 5. Volume Safety */}
                <div className="p-3 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 space-y-1 sm:col-span-2 lg:col-span-2">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5" /> Daily Volume & Warmup Limit
                    </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-zinc-300">
                      {auditResult.volumeSafety.score}/10
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-zinc-100 text-xs">
                    {auditResult.volumeSafety.status === 'passed' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : auditResult.volumeSafety.status === 'warning' ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                    )}
                    <span>
                      {auditResult.volumeSafety.status === 'passed'
                        ? `Optimal Warmup Limit (${auditResult.volumeSafety.dailyLimit} emails/day)`
                        : `Current Limit: ${auditResult.volumeSafety.dailyLimit} emails/day`}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                    Pacing jitter active: Dispatches randomized between 3-5 minutes apart to avoid spam triggers.
                  </p>
                </div>
              </div>

              {/* Actionable Recommendations List */}
              {auditResult.recommendations?.length > 0 && (
                <div className="pt-2 border-t border-slate-200/80 dark:border-zinc-800 space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Actionable Recommendations to Maximize Inbox Placement
                  </h4>
                  <div className="space-y-1.5">
                    {auditResult.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                          rec.type === 'critical'
                            ? 'bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-300'
                            : rec.type === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/25 text-amber-800 dark:text-amber-300'
                            : 'bg-indigo-500/10 border-indigo-500/25 text-indigo-800 dark:text-indigo-300'
                        }`}
                      >
                        <span className="font-bold text-xs mt-0.5">•</span>
                        <div>
                          <strong>{rec.title}:</strong> {rec.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Deliverability Safeguards */}
        <div className="saas-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-zinc-800">
            <Sliders className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Deliverability Safeguards & Daily Limits
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 dark:text-zinc-300 font-medium">Daily Outgoing Send Cap</label>
                <span className="font-mono text-slate-900 dark:text-zinc-200 font-semibold">{dailyLimit} emails/day</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1">Recommended: 20–30 emails/day to avoid spam filters.</p>
            </div>

            <div>
              <label className="text-slate-700 dark:text-zinc-300 font-medium block mb-1">Pacing Jitter (Automated)</label>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 text-[11px]">
                Randomized 3 to 5 minutes interval between dispatches.
              </div>
            </div>
          </div>
        </div>

        {/* Save Changes Footer Action Bar */}
        <div className="saas-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex-1 text-xs">
            {message.text ? (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium border animate-in fade-in ${
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
            ) : (
              <span className="text-[11px] text-slate-600 dark:text-zinc-400">
                Credentials and configurations persist permanently across sessions.
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs shadow-md transition-all disabled:opacity-50 hover:scale-[1.01]"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : justSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span className="text-emerald-500 dark:text-emerald-400">Settings Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Brand & Identity Assets Section (Designed via Stitch) */}
      <div className="saas-card p-5 sm:p-6 space-y-5 border border-slate-200 dark:border-zinc-800 shadow-sm mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Palette className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Official Brand & Identity Assets
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                Stitch Precision Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              High-resolution vector marks, dark/light lockups, and macOS/iOS squircle app icon.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/favicon.svg"
              download="techreachly-app-icon.svg"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download SVG Pack</span>
            </a>
          </div>
        </div>

        {/* Visual Brand Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Dark Mode Lockup */}
          <div className="rounded-xl border border-slate-800 bg-[#0B1326] p-4 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-900/40 text-indigo-300 border border-indigo-800">
                Dark Mode
              </span>
            </div>
            <div className="py-6 flex items-center justify-center">
              <img
                src="/techreachly-logo-dark.svg"
                alt="TechReachly Dark Logo"
                className="max-h-12 w-auto object-contain"
              />
            </div>
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 font-mono">#0B1326 Slate</span>
              <a
                href="/techreachly-logo-dark.svg"
                download="techreachly-logo-dark.svg"
                className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-medium"
              >
                <Download className="w-3 h-3" />
                <span>SVG</span>
              </a>
            </div>
          </div>

          {/* Card 2: Light Mode Lockup */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between group relative overflow-hidden shadow-xs">
            <div className="absolute top-2 right-2">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Light Mode
              </span>
            </div>
            <div className="py-6 flex items-center justify-center">
              <img
                src="/techreachly-logo-light.svg"
                alt="TechReachly Light Logo"
                className="max-h-12 w-auto object-contain"
              />
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 font-mono">#FFFFFF Pure</span>
              <a
                href="/techreachly-logo-light.svg"
                download="techreachly-logo-light.svg"
                className="text-[11px] text-indigo-600 hover:text-indigo-500 inline-flex items-center gap-1 font-medium"
              >
                <Download className="w-3 h-3" />
                <span>SVG</span>
              </a>
            </div>
          </div>

          {/* Card 3: Continuous Curvature App Icon */}
          <div className="rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/40 p-4 flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                App Icon Tile
              </span>
            </div>
            <div className="py-4 flex items-center justify-center">
              <LogoSquircle size="xl" />
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-mono">macOS/iOS Squircle</span>
              <a
                href="/favicon.svg"
                download="techreachly-app-icon.svg"
                className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline inline-flex items-center gap-1 font-medium"
              >
                <Download className="w-3 h-3" />
                <span>SVG</span>
              </a>
            </div>
          </div>
        </div>

        {/* Live Interactive Animated Lockup Preview */}
        <div className="p-4 rounded-xl bg-slate-100/70 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Live Animated Lockup:
            </span>
            <div className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200/80 dark:border-zinc-800/80 shadow-xs cursor-pointer">
              <Logo size="md" badgeText="AI ACTIVE" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 text-center sm:text-right">
            Hover to trigger dynamic aerodynamic arrow lift, radar wave expansion, and apex spark flare.
          </p>
        </div>

        {/* Color Palette Tokens */}
        <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-500 dark:text-zinc-400 text-[11px] font-medium">Design Tokens:</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <div className="w-3 h-3 rounded-full bg-[#4F46E5]" />
            <span className="font-mono text-[10px] text-slate-700 dark:text-zinc-300">#4F46E5 Primary</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <div className="w-3 h-3 rounded-full bg-[#7C3AED]" />
            <span className="font-mono text-[10px] text-slate-700 dark:text-zinc-300">#7C3AED AI Violet</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <div className="w-3 h-3 rounded-full bg-[#06B6D4]" />
            <span className="font-mono text-[10px] text-slate-700 dark:text-zinc-300">#06B6D4 Cyan Pulse</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <div className="w-3 h-3 rounded-full bg-[#0B1326]" />
            <span className="font-mono text-[10px] text-slate-700 dark:text-zinc-300">#0B1326 Dark Void</span>
          </div>
        </div>
      </div>

      {/* Floating Bottom-Right Toast for Immediate Confirmation Anywhere on Screen */}
      {message.text && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm saas-card p-3.5 shadow-2xl border border-slate-300 dark:border-zinc-700 flex items-center gap-3 animate-in slide-in-from-bottom-3 fade-in bg-white dark:bg-zinc-900">
          {message.type === 'success' ? (
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 rounded-full bg-rose-500/10 flex items-center justify-center flex-shrink-0 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          <div className="flex-1 text-xs font-medium text-slate-800 dark:text-zinc-200">
            {message.text}
          </div>
          <button
            type="button"
            onClick={() => setMessage({ text: '', type: '' })}
            className="text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white text-sm leading-none p-1 transition-colors"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
