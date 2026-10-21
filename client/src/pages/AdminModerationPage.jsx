import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Building2,
  Mail,
  User,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Check,
  X,
  Edit3,
  Trash2,
  Sparkles,
  Users,
  Eye,
} from 'lucide-react';

const REJECTION_PRESETS = [
  'Requires official corporate work email (no free webmail).',
  'Duplicate recruiter already active in the global directory.',
  'Unverified contact or mismatched company position.',
  'Invalid company website or inactive email domain.',
];

export const AdminModerationPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    totalUsers: 0,
  });
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Direct Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newRecruiter, setNewRecruiter] = useState({
    companyName: '',
    recruiterName: '',
    recruiterEmail: '',
    recruiterTitle: 'Technical Recruiter',
    techStack: '',
    website: '',
    location: 'Bangalore, India',
    industry: 'IT / Software Services',
    tier: 'general',
  });

  // Rejection Dialog State
  const [rejectDialog, setRejectDialog] = useState({
    isOpen: false,
    contactId: null,
    recruiterName: '',
    companyName: '',
    reason: '',
    submitting: false,
  });

  // Edit Modal State
  const [editModal, setEditModal] = useState({
    isOpen: false,
    contactId: null,
    companyName: '',
    recruiterName: '',
    recruiterEmail: '',
    recruiterTitle: '',
    techStack: '',
    submitting: false,
  });

  const fetchAdminData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, pendingRes] = await Promise.all([
        api.get('/hr-contacts/admin/stats'),
        api.get('/hr-contacts/admin/pending'),
      ]);

      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
      if (pendingRes.data?.success) {
        setPendingList(pendingRes.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load admin moderation data:', err);
      setMessage({
        text: err.response?.data?.message || 'Failed to fetch moderation queue.',
        type: 'error',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApprove = async (id, name, company) => {
    try {
      const res = await api.post(`/hr-contacts/admin/${id}/approve`);
      if (res.data?.success) {
        setMessage({
          text: `Approved ${name} (${company})! Contact is now live for all candidates.`,
          type: 'success',
        });
        setPendingList((prev) => prev.filter((item) => item._id !== id));
        setStats((prev) => ({
          ...prev,
          pendingCount: Math.max(0, prev.pendingCount - 1),
          approvedCount: prev.approvedCount + 1,
        }));
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to approve submission.',
        type: 'error',
      });
    }
  };

  const handleOpenReject = (contact) => {
    setRejectDialog({
      isOpen: true,
      contactId: contact._id,
      recruiterName: contact.recruiterName,
      companyName: contact.companyName,
      reason: REJECTION_PRESETS[0],
      submitting: false,
    });
  };

  const handleConfirmReject = async () => {
    if (!rejectDialog.contactId) return;
    setRejectDialog((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await api.post(`/hr-contacts/admin/${rejectDialog.contactId}/reject`, {
        reason: rejectDialog.reason,
      });
      if (res.data?.success) {
        setMessage({
          text: `Rejected submission for ${rejectDialog.recruiterName}. Candidate will see reason.`,
          type: 'success',
        });
        setPendingList((prev) => prev.filter((item) => item._id !== rejectDialog.contactId));
        setStats((prev) => ({
          ...prev,
          pendingCount: Math.max(0, prev.pendingCount - 1),
          rejectedCount: prev.rejectedCount + 1,
        }));
        setRejectDialog({ isOpen: false, contactId: null, recruiterName: '', companyName: '', reason: '', submitting: false });
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to reject submission.',
        type: 'error',
      });
      setRejectDialog((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleOpenEdit = (contact) => {
    setEditModal({
      isOpen: true,
      contactId: contact._id,
      companyName: contact.companyName || '',
      recruiterName: contact.recruiterName || '',
      recruiterEmail: contact.recruiterEmail || '',
      recruiterTitle: contact.recruiterTitle || 'Technical Recruiter',
      techStack: Array.isArray(contact.techStack) ? contact.techStack.join(', ') : (contact.techStack || ''),
      submitting: false,
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditModal((prev) => ({ ...prev, submitting: true }));
    try {
      const res = await api.put(`/hr-contacts/${editModal.contactId}`, {
        companyName: editModal.companyName,
        recruiterName: editModal.recruiterName,
        recruiterEmail: editModal.recruiterEmail,
        recruiterTitle: editModal.recruiterTitle,
        techStack: editModal.techStack,
      });
      if (res.data?.success) {
        setMessage({
          text: `Updated details for ${editModal.recruiterName} successfully.`,
          type: 'success',
        });
        setPendingList((prev) =>
          prev.map((item) => (item._id === editModal.contactId ? { ...item, ...res.data.data } : item))
        );
        setEditModal({ isOpen: false, contactId: null, companyName: '', recruiterName: '', recruiterEmail: '', recruiterTitle: '', techStack: '', submitting: false });
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to update contact.',
        type: 'error',
      });
      setEditModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleDirectAdd = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await api.post('/hr-contacts', newRecruiter);
      if (res.data?.success) {
        setMessage({
          text: `Added verified recruiter ${newRecruiter.recruiterName} directly to global directory!`,
          type: 'success',
        });
        setShowAddModal(false);
        setNewRecruiter({
          companyName: '',
          recruiterName: '',
          recruiterEmail: '',
          recruiterTitle: 'Technical Recruiter',
          techStack: '',
          website: '',
          location: 'Bangalore, India',
          industry: 'IT / Software Services',
          tier: 'general',
        });
        fetchAdminData();
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to add verified recruiter.',
        type: 'error',
      });
    } finally {
      setAdding(false);
    }
  };

  const filteredPending = pendingList.filter((item) => {
    if (!filterSearch) return true;
    const q = filterSearch.toLowerCase();
    return (
      item.companyName?.toLowerCase().includes(q) ||
      item.recruiterName?.toLowerCase().includes(q) ||
      item.recruiterEmail?.toLowerCase().includes(q) ||
      item.submittedByName?.toLowerCase().includes(q) ||
      item.submittedByEmail?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Moderation Gate</span>
            </span>
            <span className="text-xs text-slate-400 dark:text-zinc-500">•</span>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-mono">
              Logged in as {user?.email}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Recruiter Directory Moderation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            Audit candidate-submitted HR leads, verify business domains, and approve entries into the global pool.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchAdminData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-800 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-500' : ''}`} />
            <span>Refresh Queue</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Pre-Verified HR</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message.text && (
        <div
          className={`p-3.5 rounded-xl flex items-center justify-between gap-2.5 text-xs border animate-in fade-in ${
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage({ text: '', type: '' })}
            className="text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4-Bento Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="saas-card p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Pending Review
            </p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
              {stats.pendingCount}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
              Awaiting admin decision
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="saas-card p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Active Directory
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.approvedCount}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
              Live & verified contacts
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="saas-card p-4 flex items-center justify-between border-l-4 border-l-rose-500">
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Rejected Leads
            </p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {stats.rejectedCount}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
              Failed verification gates
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="saas-card p-4 flex items-center justify-between border-l-4 border-l-indigo-500">
          <div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Registered Candidates
            </p>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {stats.totalUsers}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
              Potential contributors
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Moderation Queue Section */}
      <div className="saas-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Pending Submissions Queue
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {pendingList.length} Awaiting Review
            </span>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by company, recruiter, candidate..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg saas-input text-xs"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">Loading moderation queue...</p>
          </div>
        ) : filteredPending.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
              All Clear! No Pending Submissions
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
              {pendingList.length > 0
                ? 'No submissions match your active search filter.'
                : 'Every candidate-submitted recruiter has been verified or reviewed. Great job keeping the talent pool clean!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredPending.map((item) => {
              const audit = item.auditSignals || {};
              return (
                <div
                  key={item._id}
                  className="p-4 rounded-2xl border border-slate-200/90 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60 hover:border-slate-300 dark:hover:border-zinc-700 transition-all space-y-3 shadow-xs"
                >
                  {/* Top Row: Recruiter, Company, Audit Signals */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.recruiterName}
                        </span>
                        <span className="text-slate-400 dark:text-zinc-500">•</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                          {item.recruiterTitle || 'Technical Recruiter'}
                        </span>
                        <span className="text-slate-400 dark:text-zinc-500">at</span>
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                          {item.companyName}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-zinc-400 flex-wrap">
                        <div className="flex items-center gap-1 font-mono text-[11px] text-slate-700 dark:text-zinc-300">
                          <Mail className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{item.recruiterEmail}</span>
                        </div>
                        {item.location && (
                          <span>📍 {item.location}</span>
                        )}
                        {item.website && (
                          <a
                            href={item.website}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 text-indigo-600 hover:underline"
                          >
                            Website <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Pre-Flight Audit Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {audit.isCorporateDomain ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <Check className="w-3 h-3" />
                          <span>Corporate Domain (@{audit.domain})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Webmail Warning (@{audit.domain})</span>
                        </span>
                      )}

                      {audit.duplicateCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" />
                          <span>{audit.duplicateCount} Duplicate Found</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700">
                          <span>0 Duplicates</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tech Stack Pills */}
                  {item.techStack && item.techStack.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-400 dark:text-zinc-500">Tech Stack:</span>
                      {item.techStack.map((tech, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Submitter Details & Candidate Note */}
                  <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-zinc-950/60 border border-slate-200/60 dark:border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600 dark:text-zinc-400">
                        Submitted by: <strong className="text-slate-800 dark:text-zinc-200">{item.submittedByName || 'Candidate'}</strong> ({item.submittedByEmail || 'Unknown'})
                      </span>
                    </div>
                    {item.submissionNotes && (
                      <div className="text-[11px] italic text-slate-500 dark:text-zinc-400">
                        "{item.submissionNotes}"
                      </div>
                    )}
                  </div>

                  {/* Action Buttons: 1-Click Approve, Reject, Edit */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/60">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Info</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenReject(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject Lead</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(item._id, item.recruiterName, item.companyName)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve & Publish to Global Pool</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Confirmation Dialog */}
      {rejectDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                <XCircle className="w-4 h-4" />
                <span>Reject Recruiter Submission</span>
              </div>
              <button
                type="button"
                onClick={() => setRejectDialog({ isOpen: false, contactId: null, recruiterName: '', companyName: '', reason: '', submitting: false })}
                className="text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-400">
              Rejecting <strong>{rejectDialog.recruiterName}</strong> ({rejectDialog.companyName}). Select or enter a reason so the candidate understands why it was declined:
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                Quick Reason Presets:
              </label>
              <div className="space-y-1">
                {REJECTION_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectDialog((prev) => ({ ...prev, reason: preset }))}
                    className={`w-full text-left p-2 rounded-lg text-[11px] border transition-colors ${
                      rejectDialog.reason === preset
                        ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium'
                        : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/60 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                Custom Feedback Message:
              </label>
              <textarea
                rows={2}
                value={rejectDialog.reason}
                onChange={(e) => setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))}
                className="w-full p-2.5 rounded-lg saas-input text-xs"
                placeholder="Explain why this recruiter contact was rejected..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectDialog({ isOpen: false, contactId: null, recruiterName: '', companyName: '', reason: '', submitting: false })}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejectDialog.submitting || !rejectDialog.reason.trim()}
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 transition-colors"
              >
                {rejectDialog.submitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Edit Recruiter Before Approving
              </h3>
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, contactId: null, companyName: '', recruiterName: '', recruiterEmail: '', recruiterTitle: '', techStack: '', submitting: false })}
                className="text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Company Name *</label>
                <input
                  type="text"
                  required
                  value={editModal.companyName}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Recruiter Name *</label>
                <input
                  type="text"
                  required
                  value={editModal.recruiterName}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, recruiterName: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Corporate Email *</label>
                <input
                  type="email"
                  required
                  value={editModal.recruiterEmail}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, recruiterEmail: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Title</label>
                <input
                  type="text"
                  value={editModal.recruiterTitle}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, recruiterTitle: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Tech Stack (comma separated)</label>
              <input
                type="text"
                value={editModal.techStack}
                onChange={(e) => setEditModal((prev) => ({ ...prev, techStack: e.target.value }))}
                className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
                placeholder="React, Node.js, Python, AWS"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, contactId: null, companyName: '', recruiterName: '', recruiterEmail: '', recruiterTitle: '', techStack: '', submitting: false })}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editModal.submitting}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {editModal.submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Direct Add Pre-Verified Recruiter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleDirectAdd}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                  <span>Add Pre-Verified Recruiter</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  As an administrator, this contact bypasses moderation and goes live immediately.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe"
                  value={newRecruiter.companyName}
                  onChange={(e) => setNewRecruiter((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Recruiter Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={newRecruiter.recruiterName}
                  onChange={(e) => setNewRecruiter((prev) => ({ ...prev, recruiterName: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Corporate Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. sjenkins@stripe.com"
                  value={newRecruiter.recruiterEmail}
                  onChange={(e) => setNewRecruiter((prev) => ({ ...prev, recruiterEmail: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Lead Technical Recruiter"
                  value={newRecruiter.recruiterTitle}
                  onChange={(e) => setNewRecruiter((prev) => ({ ...prev, recruiterTitle: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Tech Stack (comma separated)</label>
              <input
                type="text"
                placeholder="React, TypeScript, Go, Microservices"
                value={newRecruiter.techStack}
                onChange={(e) => setNewRecruiter((prev) => ({ ...prev, techStack: e.target.value }))}
                className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Website</label>
                <input
                  type="url"
                  placeholder="https://stripe.com"
                  value={newRecruiter.website}
                  onChange={(e) => setNewRecruiter((prev) => ({ ...prev, website: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">Location</label>
                <input
                  type="text"
                  placeholder="Bangalore / Remote"
                  value={newRecruiter.location}
                  onChange={(e) => setNewRecruiter((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adding}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-sm"
              >
                {adding ? 'Publishing...' : 'Publish to Directory'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
