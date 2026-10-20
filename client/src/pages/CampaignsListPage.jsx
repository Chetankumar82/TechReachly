import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../services/api';
import { DeleteAlertModal } from '../components/DeleteAlertModal';
import {
  Send,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  Eye,
  Trash2,
  Copy,
} from 'lucide-react';

export const CampaignsListPage = () => {
  const location = useLocation();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [flashMessage, setFlashMessage] = useState(location.state?.flashMessage || '');
  const [deletingId, setDeletingId] = useState(null);
  const [duplicatingId, setDuplicatingId] = useState(null);

  // Delete Alert Box Modal State
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    title: '',
    itemName: '',
    description: '',
    isDeleting: false,
    onConfirm: null,
  });

  const fetchCampaigns = async () => {
    try {
      const res = await api.get('/campaigns');
      if (res.data?.success) {
        setCampaigns(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const res = await api.patch(`/campaigns/${id}/status`, { status: nextStatus });
      if (res.data?.success) {
        setCampaigns(campaigns.map((c) => (c._id === id ? { ...c, status: nextStatus } : c)));
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDuplicateCampaign = async (id, name) => {
    setDuplicatingId(id);
    try {
      const res = await api.post(`/campaigns/${id}/duplicate`);
      if (res.data?.success && res.data?.data) {
        setCampaigns((prev) => [res.data.data, ...prev]);
        setFlashMessage(`Campaign "${name}" duplicated successfully! It is saved as a draft.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to duplicate campaign');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDeleteCampaign = (id, name) => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Outreach Campaign',
      itemName: name,
      description: `Are you sure you want to delete campaign "${name}"? This will cancel all pending follow-up sequences and permanently delete cadence logs.`,
      confirmText: 'Delete Campaign',
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
        setDeletingId(id);
        try {
          const res = await api.delete(`/campaigns/${id}`);
          if (res.data?.success) {
            setCampaigns((prev) => prev.filter((c) => c._id !== id));
            setFlashMessage(`Campaign "${name}" and all associated logs were deleted.`);
          }
        } catch (err) {
          setFlashMessage(err.response?.data?.message || 'Failed to delete campaign');
        } finally {
          setDeletingId(null);
          setDeleteModal({ isOpen: false, isDeleting: false, onConfirm: null });
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Outreach Campaigns & Cadences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Monitor running drip sequences, view recipient progress, and manage pauses.
          </p>
        </div>

        <Link
          to="/directory"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs shadow-sm transition-all self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Campaign</span>
        </Link>
      </div>

      {flashMessage && (
        <div className="p-3.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{flashMessage}</span>
        </div>
      )}

      {/* Campaigns List */}
      <div className="saas-card overflow-hidden">
        {campaigns.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800/60">
            {campaigns.map((campaign) => (
              <div
                key={campaign._id}
                className="p-5 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-semibold text-sm text-slate-900 dark:text-zinc-100 group-hover:dark:text-white transition-colors">{campaign.name}</h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${
                        campaign.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : campaign.status === 'paused'
                          ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      <span
                        className={`w-1 h-1 rounded-full ${
                          campaign.status === 'active'
                            ? 'bg-emerald-500 dark:bg-emerald-400'
                            : campaign.status === 'paused'
                            ? 'bg-amber-500 dark:bg-amber-400'
                            : 'bg-slate-400 dark:bg-zinc-400'
                        }`}
                      />
                      {campaign.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                    Created {new Date(campaign.createdAt).toLocaleDateString()} • 3-step cadence
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-zinc-400 pt-1 flex-wrap">
                    <span>
                      Target: <strong className="text-slate-900 dark:text-zinc-200">{campaign.stats?.total || 0}</strong>
                    </span>
                    <span>
                      Dispatched: <strong className="text-slate-900 dark:text-zinc-200">{campaign.stats?.sent || 0}</strong>
                    </span>
                    <span>
                      Opened: <strong className="text-cyan-600 dark:text-cyan-400">{campaign.stats?.opened || 0}</strong>
                    </span>
                    <span>
                      Replied: <strong className="text-emerald-600 dark:text-emerald-400">{campaign.stats?.replied || 0}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto pt-2 md:pt-0">
                  <button
                    onClick={() => handleToggleStatus(campaign._id, campaign.status)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors shadow-sm"
                  >
                    {campaign.status === 'active' ? (
                      <>
                        <Pause className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Resume
                      </>
                    )}
                  </button>

                  <Link
                    to={`/campaigns/${campaign._id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors shadow-sm"
                  >
                    <Eye className="w-3 h-3" />
                    Pipeline
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDuplicateCampaign(campaign._id, campaign.name)}
                    disabled={duplicatingId === campaign._id}
                    title="Duplicate campaign templates & settings"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-slate-500 dark:text-zinc-400" />
                    <span>{duplicatingId === campaign._id ? 'Cloning...' : 'Duplicate'}</span>
                  </button>

                  <button
                    type="button"
                    title="Delete campaign"
                    disabled={deletingId === campaign._id}
                    onClick={() => handleDeleteCampaign(campaign._id, campaign.name)}
                    className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 text-xs font-medium transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-14 text-center space-y-2.5">
            <Send className="w-8 h-8 text-slate-400 dark:text-zinc-500 mx-auto" />
            <h3 className="text-xs font-semibold text-slate-800 dark:text-zinc-200">No campaigns launched yet</h3>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 max-w-sm mx-auto">
              Select verified recruiters from the directory to launch an automated cold email cadence.
            </p>
            <div className="pt-2">
              <Link
                to="/directory"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-xs font-semibold shadow-sm transition-all"
              >
                Go to Recruiter Directory
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modern In-App Delete Alert Box */}
      <DeleteAlertModal
        isOpen={deleteModal.isOpen}
        title={deleteModal.title}
        itemName={deleteModal.itemName}
        description={deleteModal.description}
        confirmText="Delete Campaign"
        isDeleting={deleteModal.isDeleting}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false, isDeleting: false })}
        onConfirm={deleteModal.onConfirm}
      />
    </div>
  );
};
