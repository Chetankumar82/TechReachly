import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { DeleteAlertModal } from '../components/DeleteAlertModal';
import {
  ArrowLeft,
  Clock,
  Eye,
  X,
  RotateCw,
  AlertCircle,
  Trash2,
  CheckCircle2,
  Send,
  MessageSquare,
  CornerUpLeft,
  Sparkles,
  Check,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

const REPLY_CATEGORIES = [
  {
    id: 'interview',
    label: 'Interview / Screening',
    desc: 'Recruiter requested a screening call, technical interview, or meeting',
    color: 'border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200',
    badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
  },
  {
    id: 'positive',
    label: 'Positive Interest',
    desc: 'Expressed strong interest in profile, requested GitHub repo or portfolio',
    color: 'border-indigo-500/40 bg-indigo-50/70 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200',
    badge: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
  },
  {
    id: 'followup_later',
    label: 'Follow Up Later',
    desc: 'No current opening; recommended reconnecting next quarter or next year',
    color: 'border-sky-500/40 bg-sky-50/70 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200',
    badge: 'bg-sky-500/20 text-sky-700 dark:text-sky-300',
  },
  {
    id: 'not_hiring',
    label: 'Not Hiring / Closed',
    desc: 'Role filled, candidate pool finalized, or hiring freeze in effect',
    color: 'border-rose-500/40 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200',
    badge: 'bg-rose-500/20 text-rose-700 dark:text-rose-300',
  },
  {
    id: 'general',
    label: 'General Response',
    desc: 'Other general acknowledged correspondence or routing to another team',
    color: 'border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-850 text-slate-800 dark:text-zinc-200',
    badge: 'bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300',
  },
];

export const CampaignDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeLogModal, setActiveLogModal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Response Logger State
  const [replyModalLog, setReplyModalLog] = useState(null);
  const [replyCategory, setReplyCategory] = useState('interview');
  const [replyNotes, setReplyNotes] = useState('');
  const [savingReply, setSavingReply] = useState(false);
  const [replyError, setReplyError] = useState(null);

  const openReplyModal = (log) => {
    setReplyModalLog(log);
    setReplyCategory(log.replyCategory || 'interview');
    setReplyNotes(log.replyNotes || '');
    setReplyError(null);
  };

  const handleSaveReply = async () => {
    if (!replyModalLog) return;
    setSavingReply(true);
    setReplyError(null);
    try {
      const res = await api.post(`/campaigns/logs/${replyModalLog._id}/reply`, {
        replyCategory,
        replyNotes,
      });
      if (res.data?.success) {
        setReplyModalLog(null);
        await fetchCampaign();
      }
    } catch (err) {
      setReplyError(err.response?.data?.message || 'Failed to record response');
    } finally {
      setSavingReply(false);
    }
  };

  const handleUndoReply = async () => {
    if (!replyModalLog) return;
    setSavingReply(true);
    setReplyError(null);
    try {
      const res = await api.post(`/campaigns/logs/${replyModalLog._id}/unreply`);
      if (res.data?.success) {
        setReplyModalLog(null);
        await fetchCampaign();
      }
    } catch (err) {
      setReplyError(err.response?.data?.message || 'Failed to undo replied status');
    } finally {
      setSavingReply(false);
    }
  };

  const fetchCampaign = async () => {
    try {
      const res = await api.get(`/campaigns/${id}`);
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await api.post(`/campaigns/${id}/retry`);
      if (res.data?.success) {
        await fetchCampaign();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRetrying(false);
    }
  };

  const executeDeleteCampaign = async () => {
    if (!data?.campaign) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/campaigns/${id}`);
      if (res.data?.success) {
        navigate('/campaigns', {
          state: { flashMessage: `Campaign "${data.campaign.name}" was successfully deleted.` },
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete campaign');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-xs text-slate-500 dark:text-zinc-500">Loading campaign details...</div>;
  }

  if (!data || !data.campaign) {
    return <div className="py-16 text-center text-xs text-slate-500 dark:text-zinc-500">Campaign not found.</div>;
  }

  const { campaign, logs } = data;
  const hasFailedOrPaused = logs.some((l) => l.status === 'failed' || l.status === 'paused');

  // Open Tracking Stats
  const openedLogsCount = logs.filter(
    (l) => l.status === 'opened' || (l.openCount && l.openCount > 0) || l.openedAt
  ).length;
  const openRatePercent = logs.length > 0 ? Math.round((openedLogsCount / logs.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <Link
        to="/campaigns"
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition-colors font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Campaigns
      </Link>

      {/* Campaign Summary Card */}
      <div className="saas-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">{campaign.name}</h1>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                  campaign.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                }`}
              >
                <span
                  className={`w-1 h-1 rounded-full ${
                    campaign.status === 'active' ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-500 dark:bg-amber-400'
                  }`}
                />
                {campaign.status}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[11px] text-slate-500 dark:text-zinc-500">
                Launched {new Date(campaign.createdAt).toLocaleDateString()}
              </span>
              <span className="text-slate-300 dark:text-zinc-700">·</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                <Clock className="w-3 h-3" />
                <span>Intervals: Step 2 (+{campaign.sequenceTemplates?.step2?.delayDays || 3}d) • Step 3 (+{campaign.sequenceTemplates?.step3?.delayDays || 4}d)</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-3 text-slate-600 dark:text-zinc-400">
              <span>Total: <strong className="text-slate-900 dark:text-zinc-200">{logs.length}</strong></span>
              <span>Sent: <strong className="text-slate-900 dark:text-zinc-200">{campaign.stats?.sent || 0}</strong></span>
              <span>Opened: <strong className="text-cyan-600 dark:text-cyan-400 font-bold">{openedLogsCount} ({openRatePercent}%)</strong></span>
              <span>Replied: <strong className="text-emerald-600 dark:text-emerald-400">{campaign.stats?.replied || 0}</strong></span>
            </div>

            {hasFailedOrPaused && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                <RotateCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                <span>{retrying ? 'Dispatching...' : 'Retry Dispatch'}</span>
              </button>
            )}

            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? 'Deleting...' : 'Delete Campaign'}</span>
            </button>
          </div>
        </div>

        {/* Cadence Steps Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="saas-card-subtle p-3 space-y-1 text-xs">
            <span className="text-[10px] font-mono text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Step 1 • Initial Pitch</span>
            <p className="font-medium text-slate-800 dark:text-zinc-200 truncate">{campaign.sequenceTemplates?.step1?.subject}</p>
          </div>
          <div className="saas-card-subtle p-3 space-y-1 text-xs">
            <span className="text-[10px] font-mono text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Step 2 • Follow-up (+3d)</span>
            <p className="font-medium text-slate-800 dark:text-zinc-200 truncate">{campaign.sequenceTemplates?.step2?.subject}</p>
          </div>
          <div className="saas-card-subtle p-3 space-y-1 text-xs">
            <span className="text-[10px] font-mono text-slate-600 dark:text-zinc-400 uppercase tracking-wider">Step 3 • Breakup (+7d)</span>
            <p className="font-medium text-slate-800 dark:text-zinc-200 truncate">{campaign.sequenceTemplates?.step3?.subject}</p>
          </div>
        </div>
      </div>

      {/* Recipient Pipeline Tracking */}
      <div className="saas-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs">
          <h2 className="font-semibold text-slate-900 dark:text-white">Recipient Pipeline Tracking</h2>
          <span className="text-slate-600 dark:text-zinc-400">{logs.length} sequences</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[620px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-semibold text-[11px] bg-slate-50/50 dark:bg-zinc-900/40">
                <th className="py-3 px-4">Recruiter & Company</th>
                <th className="py-3 px-4">Step</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Next Send / Completed</th>
                <th className="py-3 px-4 text-right">Email History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
              {logs.map((log) => {
                const hr = log.hrContactId;
                const step2Days = campaign.sequenceTemplates?.step2?.delayDays || 3;
                const step3Days = campaign.sequenceTemplates?.step3?.delayDays || 4;
                const totalDays = step2Days + step3Days;

                const stepLabel =
                  log.currentStep === 1
                    ? 'Step 1 (Day 0 Initial)'
                    : log.currentStep === 2
                    ? `Step 2 (+${step2Days}d Bump)`
                    : log.currentStep === 3
                    ? `Step 3 (Day ${totalDays} Breakup)`
                    : 'Cadence Completed';

                const lastHistory = log.history?.[log.history.length - 1];
                const errorMsg = lastHistory?.errorMessage || log.stopReason || '';

                return (
                  <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-zinc-100 group-hover:dark:text-white transition-colors">{hr?.companyName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400">{hr?.recruiterName} ({hr?.recruiterEmail})</div>
                    </td>

                    <td className="py-3 px-4 text-slate-700 dark:text-zinc-300 font-medium">
                      {stepLabel}
                    </td>

                    <td className="py-3 px-4">
                      {log.status === 'replied' ? (
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>
                              {log.replyCategory === 'interview'
                                ? 'Interview / Screen'
                                : log.replyCategory === 'positive'
                                ? 'Positive Interest'
                                : log.replyCategory === 'followup_later'
                                ? 'Follow Up Later'
                                : log.replyCategory === 'not_hiring'
                                ? 'Not Hiring'
                                : 'Replied'}
                            </span>
                          </span>
                          {log.replyNotes && (
                            <div className="text-[10px] text-slate-600 dark:text-zinc-400 mt-0.5 max-w-xs truncate italic" title={log.replyNotes}>
                              "{log.replyNotes}"
                            </div>
                          )}
                          <div className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Follow-ups auto-halted
                          </div>
                        </div>
                      ) : (log.status === 'opened' || (log.openCount && log.openCount > 0) || log.openedAt) ? (
                        <div>
                          <span
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20"
                            title={`Recruiter opened email ${log.openCount || 1} time(s)`}
                          >
                            <Eye className="w-3 h-3 text-cyan-500" />
                            <span>Opened {log.openCount > 1 ? `(${log.openCount}x)` : ''}</span>
                          </span>
                          {log.openedAt && (
                            <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
                              {new Date(log.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                            </div>
                          )}
                        </div>
                      ) : log.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                          <Send className="w-3 h-3 text-indigo-500" />
                          <span>Delivered</span>
                        </span>
                      ) : log.status === 'failed' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            Failed
                          </span>
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 max-w-xs truncate" title={errorMsg}>
                            {errorMsg.includes('BadCredentials') || errorMsg.includes('Invalid login')
                              ? 'Gmail App Password required'
                              : errorMsg || 'Send failed'}
                          </div>
                        </div>
                      ) : log.status === 'paused' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            Paused
                          </span>
                          {log.stopReason && (
                            <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 max-w-xs truncate" title={log.stopReason}>
                              {log.stopReason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                          {log.status}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-500 dark:text-zinc-400 text-[11px] font-mono">
                      {log.status === 'completed'
                        ? 'Sequence Complete'
                        : log.nextSendAt
                        ? new Date(log.nextSendAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })
                        : 'Immediate'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {log.history && log.history.length > 0 ? (
                          <button
                            onClick={() => setActiveLogModal(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors shadow-xs"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View ({log.history.length})</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-zinc-500 mr-1">In queue</span>
                        )}

                        {log.status === 'replied' ? (
                          <button
                            onClick={() => openReplyModal(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors cursor-pointer"
                            title="Edit recruiter response notes or revert status"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Notes</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => openReplyModal(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-50 hover:bg-emerald-50 dark:bg-zinc-900 dark:hover:bg-emerald-950/40 text-slate-700 hover:text-emerald-700 dark:text-zinc-300 dark:hover:text-emerald-400 border border-slate-200 hover:border-emerald-500/30 dark:border-zinc-800 dark:hover:border-emerald-500/30 text-xs font-medium transition-colors shadow-xs cursor-pointer"
                            title="Log recruiter response and auto-stop future follow-ups"
                          >
                            <CornerUpLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Log Reply</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email History Inspection Modal */}
      {activeLogModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="saas-card max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>Email History • {activeLogModal.hrContactId?.companyName}</span>
                  {(activeLogModal.status === 'opened' || (activeLogModal.openCount && activeLogModal.openCount > 0) || activeLogModal.openedAt) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20">
                      <Eye className="w-3 h-3 text-cyan-500" />
                      Opened {activeLogModal.openCount > 1 ? `(${activeLogModal.openCount}x)` : ''}
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                  Recipient: {activeLogModal.hrContactId?.recruiterName} ({activeLogModal.hrContactId?.recruiterEmail})
                </p>
              </div>
              <button
                onClick={() => setActiveLogModal(null)}
                className="text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recruiter Response Status Banner inside Modal */}
            {activeLogModal.status === 'replied' ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Recruiter Response Logged ({activeLogModal.replyCategory || 'general'})</span>
                  </div>
                  {activeLogModal.replyNotes && (
                    <p className="text-[11px] text-emerald-950 dark:text-zinc-200 mt-1 italic">
                      "{activeLogModal.replyNotes}"
                    </p>
                  )}
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">
                    Future automated follow-up cadences are permanently halted.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const target = activeLogModal;
                    setActiveLogModal(null);
                    openReplyModal(target);
                  }}
                  className="px-2.5 py-1 rounded bg-white dark:bg-zinc-900 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium text-[11px] hover:bg-emerald-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap cursor-pointer"
                >
                  Edit Note
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs">
                <div className="text-[11px] text-slate-600 dark:text-zinc-400">
                  Did this recruiter respond to your email outreach?
                </div>
                <button
                  onClick={() => {
                    const target = activeLogModal;
                    setActiveLogModal(null);
                    openReplyModal(target);
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-xs transition-colors cursor-pointer"
                >
                  <CornerUpLeft className="w-3.5 h-3.5" />
                  <span>Log Recruiter Reply</span>
                </button>
              </div>
            )}

            <div className="space-y-3">
              {activeLogModal.history.map((item, idx) => {
                const stepOpened = item.openedAt || (item.step === 1 && activeLogModal.openedAt);
                const stepCount = item.openCount || (item.step === 1 ? activeLogModal.openCount : 0);

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-500 dark:text-zinc-400 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-zinc-300">Step {item.step} Email</span>
                        {stepOpened && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                            <Eye className="w-2.5 h-2.5 text-cyan-500" />
                            Read {stepCount > 1 ? `(${stepCount}x)` : ''} · {new Date(stepOpened).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono">
                        {new Date(item.sentAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="font-medium text-slate-900 dark:text-white">{item.subject}</div>
                    <p className="text-slate-600 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed text-[11px] pt-1">
                      {item.body}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-zinc-800">
              <button
                onClick={() => setActiveLogModal(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 rounded-lg text-xs font-medium transition-colors border border-slate-200 dark:border-transparent"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recruiter Response & Auto-Stop Follow-Up Modal */}
      {replyModalLog && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="saas-card max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {replyModalLog.status === 'replied' ? 'Edit Recruiter Response' : 'Log Recruiter Reply'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {replyModalLog.hrContactId?.companyName} • {replyModalLog.hrContactId?.recruiterName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReplyModalLog(null)}
                className="text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Reputation Shield Alert */}
            <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-500/25 flex items-start gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div className="text-[11px] text-emerald-900 dark:text-emerald-200 leading-relaxed">
                <strong>Reputation Safeguard Active:</strong> Recording a response immediately halts all future automated follow-ups (Step 2 Day 3 & Step 3 Day 7) so you never send automated emails to recruiters who already answered.
              </div>
            </div>

            {replyError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>{replyError}</span>
              </div>
            )}

            {/* Outcome Category Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-800 dark:text-zinc-200">
                Response Category
              </label>
              <div className="grid grid-cols-1 gap-2">
                {REPLY_CATEGORIES.map((cat) => {
                  const isSelected = replyCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setReplyCategory(cat.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? `${cat.color} ring-1 ring-emerald-500/30 shadow-2xs`
                          : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="text-xs font-semibold">{cat.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-zinc-400">{cat.desc}</div>
                      </div>
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <span className="w-4 h-4 rounded-full bg-emerald-600 dark:bg-emerald-400 text-white dark:text-zinc-950 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-3" />
                          </span>
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-300 dark:border-zinc-700" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-800 dark:text-zinc-200">
                Notes & Meeting Details <span className="font-normal text-slate-400 dark:text-zinc-500">(Optional)</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Recruiter replied offering a 30-min technical screening call for Friday at 2:00 PM."
                value={replyNotes}
                onChange={(e) => setReplyNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg saas-input text-xs font-sans leading-relaxed"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-zinc-800 flex-wrap gap-2">
              <div>
                {replyModalLog.status === 'replied' && (
                  <button
                    type="button"
                    onClick={handleUndoReply}
                    disabled={savingReply}
                    className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Undo "Replied" Status</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReplyModalLog(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReply}
                  disabled={savingReply}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer active:scale-95"
                >
                  {savingReply ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save & Halt Follow-Ups</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern In-App Delete Alert Box */}
      <DeleteAlertModal
        isOpen={showDeleteModal}
        title="Delete Outreach Campaign"
        itemName={data?.campaign?.name}
        description="Are you sure you want to permanently delete this campaign? All pending follow-ups and outreach logs associated with this campaign will be removed immediately."
        confirmText="Delete Campaign"
        isDeleting={deleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={executeDeleteCampaign}
      />
    </div>
  );
};
