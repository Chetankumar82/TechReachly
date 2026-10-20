import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Send,
  Users,
  FileText,
  Mail,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Plus,
  TrendingUp,
  BarChart2,
  Zap,
  Activity,
  Layers,
  Search,
  Eye,
} from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredTimelineBar, setHoveredTimelineBar] = useState(null);
  const [selectedFunnelStage, setSelectedFunnelStage] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/analytics/dashboard');
        if (res.data?.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const hasResume = stats?.resumeStatus?.hasResume;
  const isSmtpConfigured = Boolean(
    user?.smtpConfig?.authUser && (user?.smtpConfig?.authPass || user?.smtpConfig?.verified)
  );

  const funnel = stats?.funnel || {
    totalProspects: stats?.totalRecipients || 0,
    initialSent: stats?.sentCount || 0,
    followUpsSent: stats?.scheduledFollowUps || 0,
    replied: 0,
    scheduled: stats?.pendingInitial || 0,
  };

  const timeline = stats?.timeline || [
    { shortDay: 'Mon', sent: 0, scheduled: 0, dayLabel: 'Past Monday' },
    { shortDay: 'Tue', sent: 0, scheduled: 0, dayLabel: 'Past Tuesday' },
    { shortDay: 'Wed', sent: 0, scheduled: 0, dayLabel: 'Past Wednesday' },
    { shortDay: 'Thu', sent: 0, scheduled: 0, dayLabel: 'Past Thursday' },
    { shortDay: 'Fri', sent: 0, scheduled: 0, dayLabel: 'Past Friday' },
    { shortDay: 'Sat', sent: 0, scheduled: 0, dayLabel: 'Past Saturday' },
    { shortDay: 'Sun', sent: 0, scheduled: 0, dayLabel: 'Today' },
  ];

  const maxTimelineVolume = Math.max(
    ...timeline.map((t) => Math.max(t.sent || 0, t.scheduled || 0, 1)),
    4
  );

  const techDemand = stats?.techDemand || [
    { skill: 'React', count: 14, pct: 67 },
    { skill: 'Node.js', count: 12, pct: 57 },
    { skill: 'TypeScript', count: 10, pct: 48 },
    { skill: 'AWS', count: 9, pct: 43 },
    { skill: 'Python', count: 7, pct: 33 },
    { skill: 'Docker', count: 6, pct: 29 },
  ];

  const deliverabilityScore = stats?.deliverability?.score ?? 99.8;
  const sentToday = stats?.deliverability?.sentToday ?? 0;
  const dailyLimit = stats?.deliverability?.dailyLimit ?? 25;

  // Circular gauge calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * deliverabilityScore) / 100;

  return (
    <div className="space-y-8 transition-all">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            AI Recruiter Intelligence Engine Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 mt-1">
            Welcome back, <span className="text-slate-900 dark:text-white font-medium">{user?.name || 'Candidate'}</span>. Monitor active recruiter cadences, live deliverability, and response rates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/directory"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800 text-xs font-medium transition-all shadow-sm hover:border-slate-300 dark:hover:border-zinc-700"
          >
            <Users className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span>Recruiter Directory</span>
          </Link>
          <Link
            to="/campaign/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Outreach</span>
          </Link>
        </div>
      </div>

      {/* Onboarding Checklist / Setup Alert (Only if setup needed) */}
      {(!hasResume || !isSmtpConfigured) && (
        <div className="saas-card-interactive p-4 sm:p-5 border-amber-500/30 bg-amber-500/[0.04] dark:bg-amber-500/[0.06]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5">
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                  Setup Required Before Launching Outreach
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-300 mt-0.5">
                  Complete these steps so Gemini AI can extract your profile and dispatch verified emails.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                to="/resume"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  hasResume
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Resume Upload</span>
                {hasResume && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />}
              </Link>

              <Link
                to="/settings"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  isSmtpConfigured
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>SMTP Mailbox</span>
                {isSmtpConfigured && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid with micro-interactions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="saas-card-interactive p-5 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Delivered</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats?.sentCount || 0}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Paced with human jitter</span>
            </p>
          </div>
        </div>

        <div className="saas-card-interactive p-5 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Email Opens</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-baseline gap-1.5">
              <span>{stats?.openRate || 0}%</span>
              <span className="text-xs font-normal text-slate-500 dark:text-zinc-400">rate</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
              <span>{stats?.openedCount || 0} read receipts tracked</span>
            </p>
          </div>
        </div>

        <div className="saas-card-interactive p-5 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Campaigns</span>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats?.activeCampaigns || 0}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1">
              {stats?.totalCampaigns || 0} total cadences designed
            </p>
          </div>
        </div>

        <div className="saas-card-interactive p-5 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Follow-Ups Queued</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats?.scheduledFollowUps || 0}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1">
              Automated Day 3 & Day 7 drip
            </p>
          </div>
        </div>

        <div className="saas-card-interactive p-5 space-y-3 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Verified IT Leads</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              {stats?.totalDirectoryHRs || 0}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1">
              Curated tech hiring managers
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Visualizations Row: Funnel Pipeline & 7-Day Timeline Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Outreach Conversion Pipeline Funnel (7 Cols) */}
        <div className="lg:col-span-7 saas-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Outreach Conversion Pipeline
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                Multi-stage candidate delivery funnel from prospect to recruiter response
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
              Interactive
            </span>
          </div>

          {/* Funnel Steps */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
            {[
              {
                id: 'targets',
                title: 'Prospects',
                count: funnel.totalProspects,
                rate: '100%',
                desc: 'Recruiters assigned',
                gradient: 'from-blue-500/20 to-indigo-500/20',
                border: 'border-blue-500/40',
              },
              {
                id: 'step1',
                title: 'Initial Pitch',
                count: funnel.initialSent,
                rate: funnel.totalProspects > 0 ? `${Math.round((funnel.initialSent / funnel.totalProspects) * 100)}%` : '0%',
                desc: 'Day 0 email dispatched',
                gradient: 'from-indigo-500/20 to-violet-500/20',
                border: 'border-indigo-500/40',
              },
              {
                id: 'opened',
                title: 'Opened / Read',
                count: stats?.openedCount || 0,
                rate: funnel.initialSent > 0 ? `${Math.round(((stats?.openedCount || 0) / funnel.initialSent) * 100)}%` : '0%',
                desc: 'Live tracking pixel read',
                gradient: 'from-cyan-500/20 to-teal-500/20',
                border: 'border-cyan-500/40',
              },
              {
                id: 'followups',
                title: 'Follow-Ups',
                count: funnel.followUpsSent,
                rate: funnel.initialSent > 0 ? `${Math.round((funnel.followUpsSent / funnel.initialSent) * 100)}%` : '0%',
                desc: 'Day 3 & Day 7 drip',
                gradient: 'from-violet-500/20 to-purple-500/20',
                border: 'border-violet-500/40',
              },
              {
                id: 'replies',
                title: 'Replies',
                count: funnel.replied,
                rate: funnel.initialSent > 0 ? `${Math.round((funnel.replied / funnel.initialSent) * 100)}%` : '0%',
                desc: 'Direct HR responses',
                gradient: 'from-emerald-500/20 to-teal-500/20',
                border: 'border-emerald-500/40',
              },
            ].map((stage, idx) => (
              <div
                key={stage.id}
                onMouseEnter={() => setSelectedFunnelStage(stage)}
                onMouseLeave={() => setSelectedFunnelStage(null)}
                className={`p-3 rounded-xl border bg-gradient-to-br ${stage.gradient} ${
                  selectedFunnelStage?.id === stage.id
                    ? `${stage.border} scale-[1.03] shadow-md ring-1 ring-indigo-500/30`
                    : 'border-slate-200 dark:border-zinc-800'
                } transition-all duration-200 cursor-pointer flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                      0{idx + 1}
                    </span>
                    <span className="text-[10px] font-semibold text-indigo-700 dark:text-indigo-400">
                      {stage.rate}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                    {stage.count}
                  </div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                    {stage.title}
                  </div>
                </div>
                <div className="text-[10px] text-slate-600 dark:text-zinc-400 mt-2 line-clamp-1">
                  {stage.desc}
                </div>
              </div>
            ))}
          </div>

          {/* Animated Funnel Progress Bar */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-[11px] text-slate-600 dark:text-zinc-400">
              <span>Delivery Completion Flow</span>
              <span className="font-medium text-slate-800 dark:text-zinc-200">
                {funnel.totalProspects > 0 ? `${Math.round((funnel.initialSent / funnel.totalProspects) * 100)}% Delivered` : 'Ready to start'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden flex">
              <div
                className="h-full bg-indigo-600 transition-all duration-700"
                style={{
                  width: `${funnel.totalProspects > 0 ? (funnel.initialSent / funnel.totalProspects) * 100 : 0}%`,
                }}
              />
              <div
                className="h-full bg-sky-500 transition-all duration-700 opacity-80"
                style={{
                  width: `${funnel.totalProspects > 0 ? (funnel.scheduled / funnel.totalProspects) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-zinc-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Sent
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span> Queued
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-700"></span> Unsent
              </span>
            </div>
          </div>
        </div>

        {/* 7-Day Interactive Delivery Chart (5 Cols) */}
        <div className="lg:col-span-5 saas-card p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  7-Day Delivery Volume
                </h2>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Live
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
              Hover over bars to inspect daily dispatch volume
            </p>
          </div>

          {/* Interactive Bar Chart */}
          <div className="h-36 flex items-end justify-between gap-2 pt-4 px-2">
            {timeline.map((item, idx) => {
              const sentHeightPct = Math.min(100, Math.round(((item.sent || 0) / maxTimelineVolume) * 100));
              const queuedHeightPct = Math.min(100, Math.round(((item.scheduled || 0) / maxTimelineVolume) * 100));
              const isHovered = hoveredTimelineBar?.shortDay === item.shortDay;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredTimelineBar(item)}
                  onMouseLeave={() => setHoveredTimelineBar(null)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                >
                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute -top-12 z-20 px-2 py-1 rounded bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-mono whitespace-nowrap shadow-lg animate-fadeIn pointer-events-none">
                      {item.dayLabel || item.shortDay}: {item.sent} sent · {item.scheduled} queued
                    </div>
                  )}

                  {/* Bars */}
                  <div className="w-full max-w-[28px] flex items-end gap-1 h-28 bg-slate-100 dark:bg-zinc-850/60 rounded-t-md p-1 group-hover:bg-slate-200 dark:group-hover:bg-zinc-800 transition-colors">
                    <div
                      className="w-1/2 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-sm transition-all duration-300 group-hover:brightness-125"
                      style={{ height: `${Math.max(sentHeightPct, 6)}%` }}
                    />
                    <div
                      className="w-1/2 bg-gradient-to-t from-sky-500 to-sky-300 rounded-t-sm transition-all duration-300 group-hover:brightness-125 opacity-75"
                      style={{ height: `${Math.max(queuedHeightPct, 6)}%` }}
                    />
                  </div>

                  {/* Day Label */}
                  <span
                    className={`text-[10px] mt-2 font-mono transition-colors ${
                      isHovered
                        ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    {item.shortDay}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Footer Legend */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/80 pt-2 text-[10px] text-slate-500 dark:text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Dispatched Emails
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span> Queued Pacing
            </span>
          </div>
        </div>
      </div>

      {/* Secondary Row: Recruiter Tech Stack Demand & Deliverability Health Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recruiter Tech Stack Hiring Index (7 Cols) */}
        <div className="lg:col-span-7 saas-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Top Tech Stacks In Demand
                </h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                Aggregated from {stats?.totalDirectoryHRs || 21} active recruiter profiles in your CRM
              </p>
            </div>
            <Link
              to="/directory"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Browse all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {techDemand.map((item, idx) => (
              <Link
                key={idx}
                to={`/directory?search=${encodeURIComponent(item.skill)}`}
                className="p-3 rounded-lg border border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-zinc-900/40 hover:bg-white dark:hover:bg-zinc-800 transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.skill}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                    {item.count} recruiters
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, item.pct || 40)}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Deliverability & Mailbox Health Gauge (5 Cols) */}
        <div className="lg:col-span-5 saas-card p-5 space-y-4 flex flex-col justify-between">
          <div className="border-b border-slate-200 dark:border-zinc-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Mailbox Health & Safety
              </h2>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              Optimal
            </span>
          </div>

          {/* Circular SVG Gauge and Metrics */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 py-2 text-center sm:text-left">
            <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 90 90">
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="7"
                  className="text-slate-100 dark:text-zinc-800 fill-none"
                />
                <circle
                  cx="45"
                  cy="45"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="text-emerald-500 transition-all duration-1000 ease-out fill-none"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-lg font-bold text-slate-900 dark:text-white leading-none">
                  {deliverabilityScore}%
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500 dark:text-zinc-400 mt-0.5">
                  Health
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs flex-1">
              <div className="flex items-center justify-between text-slate-700 dark:text-zinc-300">
                <span>Daily Pacing:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-white">
                  {sentToday} / {dailyLimit} sent
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, (sentToday / dailyLimit) * 100)}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 pt-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Human jitter delays active (3-5m)</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-300 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <span>
              Emails are warm-delivered directly via your authenticated SMTP provider to avoid spam filters and protect inbox reputation.
            </span>
          </div>

          <Link
            to="/settings"
            className="block w-full py-2 px-3 text-center rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white border border-slate-200 dark:border-zinc-800 text-xs font-medium transition-colors"
          >
            Manage Safety Settings
          </Link>
        </div>
      </div>

      {/* Main Grid: Activity Table & Guardrails */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Outreach Activity Table (2 Cols) */}
        <div className="lg:col-span-2 saas-card overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Recent Outreach Cadences
                </h2>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
                  Live status of your recruiter email deliveries
                </p>
              </div>
              <Link
                to="/campaigns"
                className="text-xs text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white inline-flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              {stats?.recentLogs && stats.recentLogs.length > 0 ? (
                <table className="w-full text-left text-xs border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 uppercase tracking-wider font-semibold text-[11px] bg-slate-50/50 dark:bg-zinc-900/30">
                      <th className="py-3 px-5">Target Recruiter</th>
                      <th className="py-3 px-4">Step</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-5 text-right">Timing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                    {stats.recentLogs.map((log) => {
                      const hr = log.hrContactId;
                      const stepLabel =
                        log.currentStep === 1
                          ? 'Step 1 (Day 0)'
                          : log.currentStep === 2
                          ? 'Step 2 (Day 3)'
                          : log.currentStep === 3
                          ? 'Step 3 (Day 7)'
                          : 'Complete';

                      return (
                        <tr
                          key={log._id}
                          className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/60 transition-colors group"
                        >
                          <td className="py-3.5 px-5">
                            <div className="font-semibold text-slate-900 dark:text-zinc-100 group-hover:dark:text-white transition-colors">
                              {hr?.companyName || 'Target Company'}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                              {hr?.recruiterName} {hr?.recruiterTitle ? `· ${hr.recruiterTitle}` : ''}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700 dark:text-zinc-200 font-medium">
                            {stepLabel}
                          </td>
                          <td className="py-3.5 px-4">
                            {log.status === 'replied' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{log.replyCategory === 'interview' ? 'Interview' : log.replyCategory === 'positive' ? 'Positive Interest' : 'Replied'}</span>
                              </span>
                            ) : (log.status === 'opened' || (log.openCount && log.openCount > 0) || log.openedAt) ? (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20"
                                title={`Opened ${log.openCount || 1} time(s)`}
                              >
                                <Eye className="w-3 h-3 text-cyan-500" />
                                <span>Opened {log.openCount > 1 ? `(${log.openCount}x)` : ''}</span>
                              </span>
                            ) : log.status === 'sent' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                                Sent
                              </span>
                            ) : log.status === 'scheduled' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
                                Scheduled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-zinc-400" />
                                {log.status}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-5 text-right text-slate-600 dark:text-zinc-400 font-mono text-[11px]">
                            {log.lastSentAt
                              ? new Date(log.lastSentAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                })
                              : log.nextSendAt
                              ? `Queued · ${new Date(log.nextSendAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                })}`
                              : 'Queued'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 px-4">
                  <p className="text-xs text-slate-600 dark:text-zinc-300">
                    No email cadences launched yet.
                  </p>
                  <Link
                    to="/directory"
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors shadow-sm"
                  >
                    Select Recruiters from Directory
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Deliverability & System Safeguards (1 Col) */}
        <div className="saas-card p-5 space-y-4">
          <div className="border-b border-slate-200 dark:border-zinc-800 pb-3">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Deliverability Safeguards
            </h2>
            <p className="text-xs text-slate-600 dark:text-zinc-400 mt-0.5">
              Automated protections for your inbox reputation
            </p>
          </div>

          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-slate-800 dark:text-zinc-200 font-semibold">
                <span>Human Sending Jitter</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px] px-1.5 py-0.5 rounded bg-emerald-500/10">
                  Active
                </span>
              </div>
              <p className="text-slate-600 dark:text-zinc-400 text-[11px]">
                3 to 5 minutes randomized delay between emails to mimic natural human typing.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-slate-800 dark:text-zinc-200 font-semibold">
                <span>Daily Outreach Cap</span>
                <span className="text-slate-900 dark:text-zinc-100 font-mono text-[11px]">
                  {dailyLimit} / day
                </span>
              </div>
              <p className="text-slate-600 dark:text-zinc-400 text-[11px]">
                Keeps your mailbox within standard Gmail/Outlook deliverability thresholds.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-slate-800 dark:text-zinc-200 font-semibold">
                <span>AI Pitch Engine</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
                  Gemini 2.5 Flash
                </span>
              </div>
              <p className="text-slate-600 dark:text-zinc-400 text-[11px]">
                Generates resume-tailored pitches and JD matching without sounding generic.
              </p>
            </div>
          </div>

          <Link
            to="/settings"
            className="block w-full py-2 px-3 text-center rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white border border-slate-200 dark:border-zinc-800 text-xs font-semibold transition-colors shadow-sm"
          >
            Manage Deliverability Settings
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
