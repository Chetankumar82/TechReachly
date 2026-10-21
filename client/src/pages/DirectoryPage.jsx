import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DeleteAlertModal } from '../components/DeleteAlertModal';
import {
  Search,
  CheckCircle2,
  Mail,
  MapPin,
  ExternalLink,
  Plus,
  Send,
  Users,
  X,
  Edit3,
  Trash2,
  AlertCircle,
  Building2,
  Download,
  Sparkles,
  Filter,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  Lock,
  ArrowRight,
  Clock,
  XCircle,
  UserCheck,
  LogIn,
} from 'lucide-react';

const COMPANY_TIERS = [
  { id: 'all', label: 'All Companies', badge: 'All' },
  { id: 'unicorn', label: '🦄 Unicorns & Tech Giants', badge: 'Top Tier' },
  { id: 'fintech', label: '💳 Fintech & Payments', badge: 'Fintech' },
  { id: 'remote', label: '🌍 Remote-Friendly', badge: 'Remote' },
  { id: 'startup', label: '⚡ Fast-Growing Startups', badge: 'Startups' },
];

const FREE_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
  'zoho.com',
];

export const DirectoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isAdmin = user?.role === 'admin';
  const isGuest = !user;

  // Tabs: 'directory' | 'my_submissions'
  const [activeTab, setActiveTab] = useState('directory');

  const [contacts, setContacts] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [submissionStats, setSubmissionStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [techStacks, setTechStacks] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedStack, setSelectedStack] = useState(searchParams.get('techStack') || '');
  const [selectedTier, setSelectedTier] = useState('all');

  // Modals & Action States
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [unlockModal, setUnlockModal] = useState({ isOpen: false, recruiter: null });
  const [detailContact, setDetailContact] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [submittingContribute, setSubmittingContribute] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Delete Alert Box Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    title: '',
    itemName: '',
    description: '',
    confirmText: 'Yes, Delete',
    isDeleting: false,
    onConfirm: null,
  });

  // Candidate Recruiter Contribution Form
  const [contributeForm, setContributeForm] = useState({
    companyName: '',
    recruiterName: '',
    recruiterEmail: '',
    recruiterTitle: 'Technical Recruiter',
    techStack: '',
    website: '',
    location: 'Bangalore, India',
    industry: 'IT / Software Services',
    submissionNotes: '',
  });

  const fetchContacts = async (targetPage = page, targetLimit = limit) => {
    setLoading(true);
    try {
      const params = {
        page: targetPage,
        limit: targetLimit,
      };
      if (search) params.search = search;
      if (selectedStack) params.techStack = selectedStack;
      if (selectedTier && selectedTier !== 'all') params.tier = selectedTier;

      const res = await api.get('/hr-contacts', { params });
      if (res.data?.success) {
        setContacts(res.data.data || []);
        setTotal(res.data.total ?? (res.data.data || []).length);
        setTotalPages(res.data.pages || 1);
        setPage(res.data.page || targetPage);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechStacks = async () => {
    try {
      const res = await api.get('/hr-contacts/tech-stacks');
      if (res.data?.success) {
        setTechStacks(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMySubmissions = async () => {
    if (!user) return;
    setLoadingSubmissions(true);
    try {
      const res = await api.get('/hr-contacts/my-submissions');
      if (res.data?.success) {
        setMySubmissions(res.data.data || []);
        setSubmissionStats(res.data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
      }
    } catch (err) {
      console.error('Failed to load candidate submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchTechStacks();
  }, []);

  useEffect(() => {
    if (activeTab === 'directory') {
      setPage(1);
      const timer = setTimeout(() => {
        fetchContacts(1, limit);
      }, 200);
      return () => clearTimeout(timer);
    } else if (activeTab === 'my_submissions') {
      fetchMySubmissions();
    }
  }, [search, selectedStack, selectedTier, activeTab]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
      fetchContacts(newPage, limit);
    }
  };

  const handleLimitChange = (newLimit) => {
    const lim = Number(newLimit);
    setLimit(lim);
    setPage(1);
    fetchContacts(1, lim);
  };

  const handleExportCsv = (contactsToExport = null) => {
    if (isGuest) {
      setUnlockModal({
        isOpen: true,
        recruiter: { companyName: 'Global IT Directory', recruiterName: 'All Verified Contacts' },
      });
      return;
    }

    const list = contactsToExport || (selectedIds.length > 0
      ? contacts.filter((c) => selectedIds.includes(c._id))
      : contacts);

    if (!list || list.length === 0) {
      setMessage({ text: 'No recruiters found to export.', type: 'error' });
      return;
    }

    const headers = [
      'Company Name',
      'Recruiter Name',
      'Recruiter Email',
      'Recruiter Title',
      'Hiring Tech Stack',
      'Location',
      'Industry',
      'Company Size',
      'Website',
      'Verified',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [headers.join(',')];

    for (const item of list) {
      const techStackStr = Array.isArray(item.techStack)
        ? item.techStack.join(', ')
        : (item.techStack || '');
      const row = [
        escapeCsv(item.companyName),
        escapeCsv(item.recruiterName),
        escapeCsv(item.recruiterEmail),
        escapeCsv(item.recruiterTitle),
        escapeCsv(techStackStr),
        escapeCsv(item.location),
        escapeCsv(item.industry),
        escapeCsv(item.companySize || '50-200'),
        escapeCsv(item.website || ''),
        escapeCsv(item.verified ? 'Yes' : 'No'),
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', csvContent);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('download', `TechReachly_Recruiters_${dateStr}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setMessage({
      text: `Exported ${list.length} recruiter(s) to CSV spreadsheet successfully!`,
      type: 'success',
    });
  };

  const toggleSelectAll = () => {
    if (isGuest) {
      setUnlockModal({ isOpen: true, recruiter: contacts[0] || null });
      return;
    }
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map((c) => c._id));
    }
  };

  const toggleSelect = (id) => {
    if (isGuest) {
      const contact = contacts.find((c) => c._id === id);
      setUnlockModal({ isOpen: true, recruiter: contact || null });
      return;
    }
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleContributeRecruiter = async (e) => {
    e.preventDefault();
    if (isGuest) {
      setShowContributeModal(false);
      navigate('/login');
      return;
    }

    const emailDomain = contributeForm.recruiterEmail.split('@')[1]?.toLowerCase();
    if (!isAdmin && emailDomain && FREE_EMAIL_DOMAINS.includes(emailDomain)) {
      setMessage({
        text: 'Please provide an official corporate work email (e.g. @company.com). Free webmail (@gmail, @yahoo) is not accepted.',
        type: 'error',
      });
      return;
    }

    setSubmittingContribute(true);
    try {
      const res = await api.post('/hr-contacts', contributeForm);
      if (res.data?.success) {
        setShowContributeModal(false);
        setContributeForm({
          companyName: '',
          recruiterName: '',
          recruiterEmail: '',
          recruiterTitle: 'Technical Recruiter',
          techStack: '',
          website: '',
          location: 'Bangalore, India',
          industry: 'IT / Software Services',
          submissionNotes: '',
        });
        setMessage({
          text: res.data.message || (isAdmin ? 'Recruiter added directly to directory!' : 'Recruiter submitted for admin verification!'),
          type: 'success',
        });
        if (isAdmin) {
          fetchContacts();
        } else {
          fetchMySubmissions();
          setActiveTab('my_submissions');
        }
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to submit recruiter.',
        type: 'error',
      });
    } finally {
      setSubmittingContribute(false);
    }
  };

  const handleRetractSubmission = async (id, name) => {
    try {
      const res = await api.delete(`/hr-contacts/my-submissions/${id}`);
      if (res.data?.success) {
        setMessage({ text: `Retracted submission for ${name}.`, type: 'success' });
        setMySubmissions((prev) => prev.filter((item) => item._id !== id));
        setSubmissionStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          pending: Math.max(0, prev.pending - 1),
        }));
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to retract submission.',
        type: 'error',
      });
    }
  };

  const handleLaunchCampaignWithSelected = () => {
    if (isGuest) {
      setUnlockModal({ isOpen: true, recruiter: contacts[0] || null });
      return;
    }
    if (selectedIds.length === 0) return;
    navigate('/campaign/new', { state: { selectedContactIds: selectedIds } });
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Guest Discovery Banner */}
      {isGuest && (
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 text-white border border-indigo-500/30 shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-cyan-300 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Recruiter Directory</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Browsing Verified Tech Hiring Managers
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Create a free candidate account to unlock full corporate emails, match your resume skills with Gemini AI, and dispatch automated outreach cadences.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Unlock Full Emails Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Admin Quick Jump Banner */}
      {isAdmin && (
        <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>
              <strong>Administrator Mode Active:</strong> You can directly verify candidate submissions or publish new recruiters without review.
            </span>
          </div>
          <Link
            to="/admin"
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition-all shrink-0 cursor-pointer"
          >
            Open Moderation Queue →
          </Link>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Engineering Recruiter Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Curated engineering recruiters, talent acquisition leads, and technical hiring managers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleExportCsv()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            title="Download CSV spreadsheet of recruiters"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span>{selectedIds.length > 0 ? `Export (${selectedIds.length}) to CSV` : 'Export Directory CSV'}</span>
          </button>

          <button
            onClick={() => {
              if (isGuest) {
                setUnlockModal({
                  isOpen: true,
                  recruiter: { companyName: 'Tech Community', recruiterName: 'Recruiter Contribution' },
                });
              } else {
                setShowContributeModal(true);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdmin ? 'Add Pre-Verified HR' : 'Contribute Recruiter'}</span>
          </button>
        </div>
      </div>

      {/* Directory vs Candidate Submissions Tabs */}
      {!isGuest && (
        <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-zinc-800 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'directory'
                ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Verified Directory ({total})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('my_submissions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'my_submissions'
                ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Contributions</span>
            {submissionStats.pending > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {submissionStats.pending} Pending
              </span>
            )}
          </button>
        </div>
      )}

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
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
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

      {/* TAB 1: VERIFIED GLOBAL DIRECTORY */}
      {activeTab === 'directory' && (
        <>
          {/* Search and Filters */}
          <div className="saas-card p-4 space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search company, recruiter, or stack..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg saas-input text-xs"
                />
              </div>

              {/* Company Tier Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {COMPANY_TIERS.map((tier) => {
                  const isSelected = selectedTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => setSelectedTier(tier.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold shadow-xs ring-1 ring-indigo-500/30'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700/60'
                      }`}
                    >
                      <span>{tier.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tech Stack Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 border-t border-slate-100 dark:border-zinc-800/80 py-0.5 text-xs">
              <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1 flex-shrink-0 mr-1">
                <Filter className="w-3 h-3" /> Tech Stack:
              </span>
              <button
                type="button"
                onClick={() => setSelectedStack('')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex-shrink-0 cursor-pointer ${
                  selectedStack === ''
                    ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                All Stacks
              </button>
              {techStacks.slice(0, 10).map((stack) => (
                <button
                  key={stack}
                  type="button"
                  onClick={() => setSelectedStack(selectedStack === stack ? '' : stack)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors flex-shrink-0 cursor-pointer ${
                    selectedStack === stack
                      ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {stack}
                </button>
              ))}
            </div>
          </div>

          {/* Recruiter Table */}
          <div className="saas-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[680px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 uppercase tracking-wider font-semibold text-[11px] bg-slate-50/60 dark:bg-zinc-900/40">
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={contacts.length > 0 && selectedIds.length === contacts.length}
                        onChange={toggleSelectAll}
                        className="rounded bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-4">Company</th>
                    <th className="py-3 px-4">Recruiter & Contact</th>
                    <th className="py-3 px-4">Hiring Tech Stack</th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400 dark:text-zinc-500">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                        <span>Loading verified engineering recruiters...</span>
                      </td>
                    </tr>
                  ) : contacts.length > 0 ? (
                    contacts.map((contact) => {
                      const isSelected = selectedIds.includes(contact._id);
                      return (
                        <tr
                          key={contact._id}
                          className={`hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors group ${
                            isSelected ? 'bg-indigo-50/50 dark:bg-zinc-800/80' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(contact._id)}
                              className="rounded bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-700 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                            />
                          </td>

                          <td className="py-3 px-4">
                            <div
                              onClick={() => setDetailContact(contact)}
                              className="font-semibold text-slate-900 dark:text-zinc-100 group-hover:dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer hover:underline"
                              title="Click to view full recruiter profile"
                            >
                              {contact.companyName}
                              {contact.verified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" title="Verified Recruiter" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                              <span>{contact.industry || 'IT / Software'}</span>
                              {contact.website && (
                                <a
                                  href={contact.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-indigo-400 inline-flex items-center gap-0.5 transition-colors"
                                >
                                  Site <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div
                              onClick={() => setDetailContact(contact)}
                              className="font-medium text-slate-800 dark:text-zinc-200 group-hover:dark:text-white transition-colors cursor-pointer hover:underline"
                              title="Click to view full recruiter profile"
                            >
                              {contact.recruiterName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 mt-0.5 font-mono">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span className={contact.isMasked ? 'tracking-wider text-slate-400 dark:text-zinc-500 font-bold' : ''}>
                                {contact.recruiterEmail}
                              </span>
                              {contact.isMasked && (
                                <button
                                  type="button"
                                  onClick={() => setUnlockModal({ isOpen: true, recruiter: contact })}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                                  title="Sign up to unlock unmasked corporate email"
                                >
                                  <Eye className="w-2.5 h-2.5" />
                                  <span>Unlock</span>
                                </button>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-zinc-400">
                              {contact.recruiterTitle}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(contact.techStack || []).slice(0, 4).map((tech, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-200 font-medium"
                                >
                                  {tech}
                                </span>
                              ))}
                              {(contact.techStack || []).length > 4 && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                                  +{(contact.techStack || []).length - 4}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-600 dark:text-zinc-300 text-[11px]">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 dark:text-zinc-400" />
                              <span>{contact.location || 'Remote / Hybrid'}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setDetailContact(contact)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="View full recruiter profile details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {isGuest ? (
                                <button
                                  type="button"
                                  onClick={() => setUnlockModal({ isOpen: true, recruiter: contact })}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-xs"
                                >
                                  <Lock className="w-3 h-3" />
                                  <span>Pitch Recruiter</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => navigate('/campaign/new', { state: { selectedContactIds: [contact._id] } })}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-xs"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Pitch</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-zinc-500">
                        No recruiters found matching the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/40 dark:bg-zinc-900/20 text-xs">
              <div className="text-slate-500 dark:text-zinc-400">
                Showing{' '}
                <strong className="text-slate-800 dark:text-zinc-200">
                  {total > 0 ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, total)}
                </strong>{' '}
                of <strong className="text-slate-800 dark:text-zinc-200">{total}</strong> verified recruiters
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 dark:text-zinc-400 text-[11px]">Rows:</span>
                  <select
                    value={limit}
                    onChange={(e) => handleLimitChange(e.target.value)}
                    className="px-2 py-1 rounded-md saas-input text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={15}>15</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <span className="px-2 text-xs font-medium text-slate-700 dark:text-zinc-300">
                    {page} / {totalPages || 1}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: CANDIDATE'S OWN SUBMISSIONS */}
      {activeTab === 'my_submissions' && !isGuest && (
        <div className="space-y-4">
          {/* Submission Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="saas-card p-4 border-l-4 border-l-indigo-500">
              <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Total Contributed
              </p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {submissionStats.total}
              </p>
            </div>
            <div className="saas-card p-4 border-l-4 border-l-amber-500">
              <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Awaiting Verification
              </p>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {submissionStats.pending}
              </p>
            </div>
            <div className="saas-card p-4 border-l-4 border-l-emerald-500">
              <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Approved & Live
              </p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {submissionStats.approved}
              </p>
            </div>
          </div>

          <div className="saas-card p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                  Your Recruiter Contributions
                </h2>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Track the moderation status of hiring managers and talent leads you submitted to the community.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowContributeModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Submit Another Recruiter</span>
              </button>
            </div>

            {loadingSubmissions ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span>Loading your submissions...</span>
              </div>
            ) : mySubmissions.length === 0 ? (
              <div className="py-14 text-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                <Users className="w-10 h-10 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  You haven't contributed any recruiters yet
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
                  Share active hiring managers or technical recruiters you've connected with. Once an admin approves the business domain, it helps the whole engineering community!
                </p>
                <button
                  type="button"
                  onClick={() => setShowContributeModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer"
                >
                  Contribute Your First Recruiter
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {mySubmissions.map((sub) => (
                  <div
                    key={sub._id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-slate-900 dark:text-white font-semibold">
                          {sub.recruiterName}
                        </strong>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600 dark:text-zinc-300">
                          {sub.recruiterTitle || 'Technical Recruiter'}
                        </span>
                        <span className="text-slate-400">at</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {sub.companyName}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{sub.recruiterEmail}</span>
                      </div>
                      {sub.rejectionReason && (
                        <div className="text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900/40">
                          <strong>Admin Feedback:</strong> {sub.rejectionReason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {sub.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          <span>Under Admin Review</span>
                        </span>
                      )}
                      {sub.status === 'approved' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approved & Live</span>
                        </span>
                      )}
                      {sub.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}

                      {sub.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleRetractSubmission(sub._id, sub.recruiterName)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title="Retract submission"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Batch Outreach Action Bar */}
      {selectedIds.length > 0 && !isGuest && (
        <div className="fixed bottom-6 inset-x-0 z-40 max-w-xl mx-auto px-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="bg-slate-900/95 dark:bg-zinc-900/95 backdrop-blur-xl text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/60 dark:border-zinc-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              <span>
                <strong>{selectedIds.length}</strong> recruiter(s) selected
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleLaunchCampaignWithSelected}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/30 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Launch AI Campaign</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: UNLOCK RECRUITER CONTACT (GUEST GATED CONVERSION) */}
      {unlockModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-center relative">
            <button
              type="button"
              onClick={() => setUnlockModal({ isOpen: false, recruiter: null })}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Unlock Direct Recruiter Outreach
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                Connect directly with{' '}
                <strong>
                  {unlockModal.recruiter?.recruiterName || 'Verified Recruiter'}
                </strong>{' '}
                at{' '}
                <strong className="text-indigo-600 dark:text-indigo-400">
                  {unlockModal.recruiter?.companyName || 'Top Tech'}
                </strong>
                . Sign in or register in 10 seconds to reveal full corporate emails and dispatch Gemini AI outreach.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Unmasked corporate verified work email</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>AI pitch generator matched to candidate resume</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Multi-step follow-up scheduler via your custom mailbox</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <Link
                to="/register"
                className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Create Free Candidate Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="w-full py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Already have an account? Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANDIDATE CONTRIBUTE RECRUITER */}
      {showContributeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleContributeRecruiter}
            className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-500" />
                  <span>{isAdmin ? 'Add Pre-Verified HR' : 'Contribute a Recruiter'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {isAdmin
                    ? 'As an administrator, this entry will be verified and published immediately.'
                    : 'Submissions are verified by our team to protect delivery reputations before going live.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowContributeModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swiggy"
                  value={contributeForm.companyName}
                  onChange={(e) => setContributeForm((prev) => ({ ...prev, companyName: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  Recruiter Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={contributeForm.recruiterName}
                  onChange={(e) => setContributeForm((prev) => ({ ...prev, recruiterName: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  Corporate Work Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. rahul.v@swiggy.in"
                  value={contributeForm.recruiterEmail}
                  onChange={(e) => setContributeForm((prev) => ({ ...prev, recruiterEmail: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs font-mono"
                />
                {!isAdmin && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Corporate domains only (no @gmail or @yahoo).
                  </p>
                )}
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  Recruiter Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Talent Acquisition Lead"
                  value={contributeForm.recruiterTitle}
                  onChange={(e) => setContributeForm((prev) => ({ ...prev, recruiterTitle: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                Hiring Tech Stack (comma separated)
              </label>
              <input
                type="text"
                placeholder="React, Node.js, AWS, Kubernetes"
                value={contributeForm.techStack}
                onChange={(e) => setContributeForm((prev) => ({ ...prev, techStack: e.target.value }))}
                className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  Company Website / Careers
                </label>
                <input
                  type="url"
                  placeholder="https://company.com"
                  value={contributeForm.website}
                  onChange={(e) => setContributeForm((prev) => ({ ...prev, website: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="Bangalore / Remote"
                  value={contributeForm.location}
                  onChange={(e) => setContributeForm((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
                />
              </div>
            </div>

            {!isAdmin && (
              <div>
                <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
                  Verification Notes / Source (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Recruiter posted on LinkedIn hiring for MERN stack"
                  value={contributeForm.submissionNotes}
                  onChange={(e) => setContributeForm((prev) => ({ ...prev, submissionNotes: e.target.value }))}
                  className="w-full mt-1 p-2 rounded-lg saas-input text-xs"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setShowContributeModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingContribute}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors shadow-sm"
              >
                {submittingContribute ? 'Submitting...' : isAdmin ? 'Publish to Pool' : 'Submit for Verification'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: FULL HR PROFILE & CONTACT DOSSIER */}
      {detailContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 relative">
            <button
              type="button"
              onClick={() => {
                setDetailContact(null);
                setCopiedEmail(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-zinc-400 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Profile Header */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-400 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-md">
                {detailContact.recruiterName ? detailContact.recruiterName.slice(0, 2).toUpperCase() : 'HR'}
              </div>

              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {detailContact.recruiterName}
                  </h3>
                  {detailContact.verified && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-cyan-400 shrink-0" title="Verified Engineering Recruiter" />
                  )}
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-zinc-300">
                  {detailContact.recruiterTitle || 'Technical Recruiter'}
                </p>
                <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                    {detailContact.companyName}
                  </span>
                  <span className="text-slate-300 dark:text-zinc-700">•</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {detailContact.industry || 'IT / Software'}
                  </span>
                </div>
              </div>
            </div>

            {/* Recruiter Details Grid */}
            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500">Location</span>
                <p className="font-medium text-slate-800 dark:text-zinc-200 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{detailContact.location || 'Remote / Hybrid'}</span>
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-zinc-500">Company Website</span>
                <p className="font-medium text-slate-800 dark:text-zinc-200 mt-0.5">
                  {detailContact.website ? (
                    <a
                      href={detailContact.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-slate-400">Not provided</span>
                  )}
                </p>
              </div>
            </div>

            {/* Work Email Bar */}
            <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-zinc-950/70 border border-indigo-100 dark:border-zinc-800 space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-cyan-400">
                Official Corporate Email
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-slate-900 dark:text-white font-medium select-all">
                  {detailContact.recruiterEmail}
                </span>

                {isGuest ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailContact(null);
                      setUnlockModal({ isOpen: true, recruiter: detailContact });
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer"
                  >
                    Unlock Full Email
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(detailContact.recruiterEmail);
                      setCopiedEmail(true);
                      setTimeout(() => setCopiedEmail(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    {copiedEmail ? 'Copied!' : 'Copy'}
                  </button>
                )}
              </div>
            </div>

            {/* Hiring Tech Stack */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300">
                Target Engineering Tech Stack
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(detailContact.techStack || []).map((tech, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 font-medium"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setDetailContact(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Close
              </button>

              {isGuest ? (
                <button
                  type="button"
                  onClick={() => {
                    setDetailContact(null);
                    setUnlockModal({ isOpen: true, recruiter: detailContact });
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  Create Account to Pitch Recruiter
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setDetailContact(null);
                    navigate('/campaign/new', { state: { selectedContactIds: [detailContact._id] } });
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Launch Cold Outreach</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      <DeleteAlertModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        itemName={deleteModal.itemName}
        description={deleteModal.description}
        confirmText={deleteModal.confirmText}
        isDeleting={deleteModal.isDeleting}
        onConfirm={deleteModal.onConfirm}
        onCancel={() => setDeleteModal({ isOpen: false, isDeleting: false, onConfirm: null })}
      />
    </div>
  );
};
