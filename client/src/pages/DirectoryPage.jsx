import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
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
} from 'lucide-react';

const COMPANY_TIERS = [
  { id: 'all', label: 'All Companies', badge: 'All' },
  { id: 'unicorn', label: '🦄 Unicorns & Tech Giants', badge: 'Top Tier' },
  { id: 'fintech', label: '💳 Fintech & Payments', badge: 'Fintech' },
  { id: 'remote', label: '🌍 Remote-Friendly', badge: 'Remote' },
  { id: 'startup', label: '⚡ Fast-Growing Startups', badge: 'Startups' },
];

export const DirectoryPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [contacts, setContacts] = useState([]);
  const [techStacks, setTechStacks] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters initialized from URL query params (e.g., from Dashboard tech stack clicks)
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedStack, setSelectedStack] = useState(searchParams.get('techStack') || '');
  const [selectedTier, setSelectedTier] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
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

  // New Contact Form
  const [newContact, setNewContact] = useState({
    companyName: '',
    recruiterName: '',
    recruiterEmail: '',
    recruiterTitle: 'Technical Recruiter',
    techStack: '',
    website: '',
    location: 'Bangalore, India',
    industry: 'IT / Software',
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

  useEffect(() => {
    fetchTechStacks();
  }, []);

  // When search or filter changes, reset to page 1
  useEffect(() => {
    setPage(1);
    const timer = setTimeout(() => {
      fetchContacts(1, limit);
    }, 200);
    return () => clearTimeout(timer);
  }, [search, selectedStack, selectedTier]);

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
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map((c) => c._id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/hr-contacts', newContact);
      if (res.data?.success) {
        setShowAddModal(false);
        setNewContact({
          companyName: '',
          recruiterName: '',
          recruiterEmail: '',
          recruiterTitle: 'Technical Recruiter',
          techStack: '',
          website: '',
          location: 'Bangalore, India',
          industry: 'IT / Software',
        });
        setMessage({ text: 'Recruiter added successfully!', type: 'success' });
        fetchContacts();
        fetchTechStacks();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to add contact', type: 'error' });
    }
  };

  const handleOpenEditModal = (contact) => {
    setEditingContact({
      _id: contact._id,
      companyName: contact.companyName || '',
      recruiterName: contact.recruiterName || '',
      recruiterEmail: contact.recruiterEmail || '',
      recruiterTitle: contact.recruiterTitle || 'Technical Recruiter',
      techStack: Array.isArray(contact.techStack) ? contact.techStack.join(', ') : (contact.techStack || ''),
      website: contact.website || '',
      location: contact.location || '',
      industry: contact.industry || 'IT / Software',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingContact) return;
    setSavingEdit(true);
    try {
      const res = await api.put(`/hr-contacts/${editingContact._id}`, editingContact);
      if (res.data?.success) {
        setContacts((prev) =>
          prev.map((c) => (c._id === editingContact._id ? res.data.data : c))
        );
        setMessage({ text: `Updated ${editingContact.recruiterName} (${editingContact.companyName}) successfully!`, type: 'success' });
        setEditingContact(null);
        fetchTechStacks();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update contact', type: 'error' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteContact = (id, recruiterName, companyName) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Recruiter Contact',
      itemName: `${companyName || 'Company'} • ${recruiterName || 'Recruiter'}`,
      description: `Are you sure you want to delete ${recruiterName || 'this recruiter'}? They will be removed from your active directory permanently.`,
      confirmText: 'Delete Recruiter',
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
        setDeletingId(id);
        try {
          const res = await api.delete(`/hr-contacts/${id}`);
          if (res.data?.success) {
            setContacts((prev) => prev.filter((c) => c._id !== id));
            setSelectedIds((prev) => prev.filter((item) => item !== id));
            setMessage({ text: `Deleted ${recruiterName} (${companyName}) from directory.`, type: 'success' });
          }
        } catch (err) {
          setMessage({ text: err.response?.data?.message || 'Failed to delete contact', type: 'error' });
        } finally {
          setDeletingId(null);
          setDeleteModal({ isOpen: false, isDeleting: false, onConfirm: null });
        }
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setDeleteModal({
      isOpen: true,
      title: 'Bulk Delete Recruiters',
      itemName: `${selectedIds.length} Selected Recruiters`,
      description: `Are you sure you want to permanently delete all ${selectedIds.length} selected recruiters? This action cannot be undone.`,
      confirmText: `Delete ${selectedIds.length} Recruiters`,
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
        try {
          const res = await api.post('/hr-contacts/bulk-delete', { ids: selectedIds });
          if (res.data?.success) {
            setContacts((prev) => prev.filter((c) => !selectedIds.includes(c._id)));
            setMessage({ text: res.data.message || `Deleted ${selectedIds.length} recruiters successfully`, type: 'success' });
            setSelectedIds([]);
          }
        } catch (err) {
          setMessage({ text: err.response?.data?.message || 'Failed to delete selected contacts', type: 'error' });
        } finally {
          setDeleteModal({ isOpen: false, isDeleting: false, onConfirm: null });
        }
      },
    });
  };

  const handleLaunchCampaignWithSelected = () => {
    if (selectedIds.length === 0) return;
    navigate('/campaign/new', { state: { selectedContactIds: selectedIds } });
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            IT Recruiter Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Curated engineering recruiters, talent acquisition leads, and technical hiring managers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleExportCsv()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-zinc-800 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            title="Download CSV spreadsheet of recruiters"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
            <span>{selectedIds.length > 0 ? `Export (${selectedIds.length}) to CSV` : 'Export Directory CSV'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Recruiter</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
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

      {/* Search and Filters */}
      <div className="saas-card p-4 space-y-3">
        {/* Row 1: Search Bar & Company Tier Quick-Filters */}
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

        {/* Row 2: Tech Stack Filter Pills */}
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
                <th className="py-3 px-4">Recruiter</th>
                <th className="py-3 px-4">Hiring Tech Stack</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50">
              {contacts.length > 0 ? (
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
                        <div className="font-semibold text-slate-900 dark:text-zinc-100 group-hover:dark:text-white flex items-center gap-1.5 transition-colors">
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
                        <div className="font-medium text-slate-800 dark:text-zinc-200 group-hover:dark:text-white transition-colors">{contact.recruiterName}</div>
                        <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5 font-mono">
                          <Mail className="w-3 h-3 text-slate-400 dark:text-zinc-400" />
                          <span>{contact.recruiterEmail}</span>
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
                            title="Edit recruiter details"
                            onClick={() => handleOpenEditModal(contact)}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            title="Delete recruiter"
                            disabled={deletingId === contact._id}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteContact(contact._id, contact.recruiterName, contact.companyName);
                            }}
                            className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              navigate('/campaign/new', { state: { selectedContactIds: [contact._id] } });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white border border-slate-200 dark:border-zinc-800 text-xs font-medium transition-colors shadow-xs ml-0.5"
                          >
                            <Send className="w-3 h-3" />
                            Outreach
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-zinc-400 text-xs">
                    {loading ? 'Loading recruiters...' : 'No recruiters found matching the filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {total > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span>Showing</span>
              <span className="font-semibold text-slate-800 dark:text-zinc-200 font-mono">
                {(page - 1) * limit + 1}–{Math.min(page * limit, total)}
              </span>
              <span>of</span>
              <span className="font-semibold text-slate-800 dark:text-zinc-200 font-mono">{total}</span>
              <span>recruiters</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400 dark:text-zinc-500">Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => handleLimitChange(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 text-xs focus:outline-none focus:border-indigo-500 font-mono"
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
                  disabled={page <= 1 || loading}
                  onClick={() => handlePageChange(page - 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-2 font-mono text-xs text-slate-700 dark:text-zinc-300 font-semibold">
                  Page {page} of {totalPages}
                </div>

                <button
                  type="button"
                  disabled={page >= totalPages || loading}
                  onClick={() => handlePageChange(page + 1)}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Selection Dock */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 saas-card bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-300 dark:border-zinc-700/80 px-3.5 sm:px-4 py-2 sm:py-2.5 shadow-2xl rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4 w-[calc(100%-1.5rem)] sm:w-auto max-w-xl">
          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                {selectedIds.length}
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                {selectedIds.length === 1 ? '1 recruiter selected' : `${selectedIds.length} recruiters selected`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition-colors px-2 py-0.5 sm:hidden"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="hidden sm:inline-block text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white transition-colors px-2 py-1 cursor-pointer"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleExportCsv(contacts.filter((c) => selectedIds.includes(c._id)))}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 text-xs font-semibold transition-colors shadow-xs cursor-pointer active:scale-95"
              title="Download CSV spreadsheet for selected recruiters"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBulkDelete();
              }}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 text-xs font-semibold transition-colors shadow-xs cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <button
              type="button"
              onClick={handleLaunchCampaignWithSelected}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer flex-1 sm:flex-none justify-center"
            >
              <Send className="w-3 h-3" />
              <span>Outreach</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Custom Recruiter Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="saas-card max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                Add Recruiter to Directory
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-zinc-400 mb-1 font-medium">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Atlassian, Uber, Flipkart"
                  value={newContact.companyName}
                  onChange={(e) => setNewContact({ ...newContact, companyName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 mb-1 font-medium">Recruiter Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={newContact.recruiterName}
                    onChange={(e) => setNewContact({ ...newContact, recruiterName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 mb-1 font-medium">Job Title</label>
                  <input
                    type="text"
                    value={newContact.recruiterTitle}
                    onChange={(e) => setNewContact({ ...newContact, recruiterTitle: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-zinc-400 mb-1 font-medium">Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="recruiter@company.com"
                  value={newContact.recruiterEmail}
                  onChange={(e) => setNewContact({ ...newContact, recruiterEmail: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg saas-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-zinc-400 mb-1 font-medium">Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  placeholder="React, Node.js, AWS, Kubernetes"
                  value={newContact.techStack}
                  onChange={(e) => setNewContact({ ...newContact, techStack: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 mb-1 font-medium">Website URL</label>
                  <input
                    type="text"
                    placeholder="https://company.com"
                    value={newContact.website}
                    onChange={(e) => setNewContact({ ...newContact, website: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 mb-1 font-medium">Location</label>
                  <input
                    type="text"
                    value={newContact.location}
                    onChange={(e) => setNewContact({ ...newContact, location: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-xs font-semibold shadow-sm transition-all"
                >
                  Save Recruiter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Recruiter Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="saas-card max-w-lg w-full p-6 space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                  Edit Recruiter Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingContact(null)}
                className="text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 mb-1 font-medium">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={editingContact.companyName}
                    onChange={(e) => setEditingContact({ ...editingContact, companyName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 mb-1 font-medium">Industry</label>
                  <input
                    type="text"
                    value={editingContact.industry}
                    onChange={(e) => setEditingContact({ ...editingContact, industry: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 mb-1 font-medium">Recruiter Name *</label>
                  <input
                    type="text"
                    required
                    value={editingContact.recruiterName}
                    onChange={(e) => setEditingContact({ ...editingContact, recruiterName: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 mb-1 font-medium">Job Title</label>
                  <input
                    type="text"
                    value={editingContact.recruiterTitle}
                    onChange={(e) => setEditingContact({ ...editingContact, recruiterTitle: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-zinc-400 mb-1 font-medium">Work Email *</label>
                <input
                  type="email"
                  required
                  value={editingContact.recruiterEmail}
                  onChange={(e) => setEditingContact({ ...editingContact, recruiterEmail: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg saas-input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-zinc-400 mb-1 font-medium">Hiring Tech Stack (comma-separated)</label>
                <input
                  type="text"
                  placeholder="React, Node.js, Express, MongoDB"
                  value={editingContact.techStack}
                  onChange={(e) => setEditingContact({ ...editingContact, techStack: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 mb-1 font-medium">Website URL</label>
                  <input
                    type="text"
                    placeholder="https://company.com"
                    value={editingContact.website}
                    onChange={(e) => setEditingContact({ ...editingContact, website: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-zinc-400 mb-1 font-medium">Location</label>
                  <input
                    type="text"
                    value={editingContact.location}
                    onChange={(e) => setEditingContact({ ...editingContact, location: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingContact(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                >
                  {savingEdit ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern In-App Delete Alert Box */}
      <DeleteAlertModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        itemName={deleteModal.itemName}
        description={deleteModal.description}
        confirmText={deleteModal.confirmText}
        isDeleting={deleteModal.isDeleting}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false, isDeleting: false })}
        onConfirm={deleteModal.onConfirm}
      />
    </div>
  );
};
