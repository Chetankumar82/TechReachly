import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { DeleteAlertModal } from '../components/DeleteAlertModal';
import {
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code,
  Briefcase,
  Save,
  GraduationCap,
  Plus,
  Trash2,
  Link2,
  User,
  Mail,
  Phone,
  Edit3,
  FileText,
  Check,
  X,
  Layers,
} from 'lucide-react';

const COMMON_SKILLS = [
  'React.js',
  'Node.js',
  'Express.js',
  'MongoDB',
  'JavaScript',
  'TypeScript',
  'Tailwind CSS',
  'Next.js',
  'REST APIs',
  'Redux Toolkit',
  'Git & GitHub',
  'Docker',
];

export const ResumePage = () => {
  const { user } = useAuth();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('editor'); // 'upload' | 'editor'

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

  // Comprehensive candidate profile state (initialized with logged-in user identity)
  const [parsedData, setParsedData] = useState(() => ({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    currentRole: '',
    experienceYears: 0,
    experienceMonths: 0,
    isFresher: false,
    summary: '',
    skills: [],
    links: { github: '', linkedin: '', portfolio: '', resume: '' },
    keyProjects: [],
    education: [],
  }));

  const [newSkill, setNewSkill] = useState('');
  const [projectTechInputs, setProjectTechInputs] = useState({});

  const fetchResume = async () => {
    try {
      const res = await api.get('/resume');
      if (res.data?.success && res.data?.data) {
        setResume(res.data.data);
        if (res.data.data.parsedData) {
          const pd = res.data.data.parsedData;
          setParsedData({
            fullName: pd.fullName || user?.name || '',
            email: pd.email || user?.email || '',
            phone: pd.phone || '',
            currentRole: pd.currentRole || '',
            experienceYears: pd.experienceYears !== undefined ? pd.experienceYears : 0,
            experienceMonths: pd.experienceMonths !== undefined ? pd.experienceMonths : 0,
            isFresher: pd.isFresher !== undefined ? Boolean(pd.isFresher) : (pd.experienceYears === 0 && (!pd.experienceMonths || pd.experienceMonths === 0)),
            summary: pd.summary || '',
            skills: Array.isArray(pd.skills) ? pd.skills : [],
            links: {
              github: pd.links?.github || '',
              linkedin: pd.links?.linkedin || '',
              portfolio: pd.links?.portfolio || '',
              resume: pd.links?.resume || '',
            },
            keyProjects: Array.isArray(pd.keyProjects) ? pd.keyProjects : [],
            education: Array.isArray(pd.education) ? pd.education : [],
          });
        }
      }
    } catch (err) {
      // No resume uploaded yet - prefill with candidate's registered name and email
      console.log('No existing resume found; manual entry ready for user:', user?.email);
      setResume(null);
      setParsedData((prev) => ({
        ...prev,
        fullName: prev.fullName || user?.name || '',
        email: prev.email || user?.email || '',
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResume();
  }, [user?._id]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setMessage({ text: '', type: '' });

    const formData = new FormData();
    formData.append('resume', selectedFile);

    try {
      const res = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        const data = res.data.data;
        setResume(data);
        if (data.parsedData) {
          const pd = data.parsedData;
          setParsedData({
            fullName: pd.fullName || '',
            email: pd.email || '',
            phone: pd.phone || '',
            currentRole: pd.currentRole || '',
            experienceYears: pd.experienceYears !== undefined ? pd.experienceYears : 0,
            experienceMonths: pd.experienceMonths !== undefined ? pd.experienceMonths : 0,
            isFresher: pd.isFresher !== undefined ? Boolean(pd.isFresher) : (pd.experienceYears === 0 && (!pd.experienceMonths || pd.experienceMonths === 0)),
            summary: pd.summary || '',
            skills: Array.isArray(pd.skills) ? pd.skills : [],
            links: {
              github: pd.links?.github || '',
              linkedin: pd.links?.linkedin || '',
              portfolio: pd.links?.portfolio || '',
              resume: pd.links?.resume || '',
            },
            keyProjects: Array.isArray(pd.keyProjects) ? pd.keyProjects : [],
            education: Array.isArray(pd.education) ? pd.education : [],
          });
        }
        setMessage({
          text: 'Resume parsed and details populated! You can now review and edit below.',
          type: 'success',
        });
        setSelectedFile(null);
        setActiveTab('editor'); // Automatically switch to the editor so user can verify & adjust
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to upload and parse resume',
        type: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    setJustSaved(false);

    try {
      const res = await api.put('/resume', { parsedData });
      if (res.data?.success) {
        setResume(res.data.data);
        setJustSaved(true);
        setMessage({ text: 'Candidate profile saved successfully and updated in MongoDB!', type: 'success' });

        setTimeout(() => setJustSaved(false), 3000);
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Skill management
  const handleAddSkill = (skillToAdd) => {
    const s = (skillToAdd || newSkill).trim();
    if (s && !parsedData.skills.includes(s)) {
      setParsedData((prev) => ({
        ...prev,
        skills: [...prev.skills, s],
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setDeleteModal({
      isOpen: true,
      title: 'Remove Skill',
      itemName: skillToRemove,
      description: `Are you sure you want to remove "${skillToRemove}" from your technical skills list?`,
      confirmText: 'Remove Skill',
      isDeleting: false,
      onConfirm: () => {
        setParsedData((prev) => ({
          ...prev,
          skills: prev.skills.filter((s) => s !== skillToRemove),
        }));
        setMessage({ text: `Removed skill "${skillToRemove}". Remember to click "Save Profile Details" to persist changes.`, type: 'success' });
        setDeleteModal({ isOpen: false, isDeleting: false, onConfirm: null });
      },
    });
  };

  // Project management
  const handleAddProject = () => {
    setParsedData((prev) => ({
      ...prev,
      keyProjects: [
        ...prev.keyProjects,
        {
          title: '',
          description: '',
          techStack: [],
          highlights: '',
          link: '',
        },
      ],
    }));
  };

  const handleUpdateProject = (index, field, value) => {
    setParsedData((prev) => {
      const updated = [...prev.keyProjects];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, keyProjects: updated };
    });
  };

  const handleDeleteProject = (index) => {
    const proj = parsedData.keyProjects[index];
    const projName = proj?.title || `Project #${index + 1}`;
    setDeleteModal({
      isOpen: true,
      title: 'Delete Key Project',
      itemName: projName,
      description: `Are you sure you want to delete "${projName}"? Its description, highlights, and tech stack will be removed.`,
      confirmText: 'Delete Project',
      isDeleting: false,
      onConfirm: () => {
        setParsedData((prev) => ({
          ...prev,
          keyProjects: prev.keyProjects.filter((_, i) => i !== index),
        }));
        setMessage({ text: `Project "${projName}" removed successfully. Click "Save Profile Details" to persist.`, type: 'success' });
        setDeleteModal({ isOpen: false, isDeleting: false, onConfirm: null });
      },
    });
  };

  const handleAddProjectTech = (pIndex) => {
    const tech = (projectTechInputs[pIndex] || '').trim();
    if (!tech) return;

    setParsedData((prev) => {
      const updated = [...prev.keyProjects];
      const currentStack = updated[pIndex].techStack || [];
      if (!currentStack.includes(tech)) {
        updated[pIndex] = {
          ...updated[pIndex],
          techStack: [...currentStack, tech],
        };
      }
      return { ...prev, keyProjects: updated };
    });

    setProjectTechInputs((prev) => ({ ...prev, [pIndex]: '' }));
  };

  const handleRemoveProjectTech = (pIndex, techToRemove) => {
    setParsedData((prev) => {
      const updated = [...prev.keyProjects];
      updated[pIndex] = {
        ...updated[pIndex],
        techStack: (updated[pIndex].techStack || []).filter((t) => t !== techToRemove),
      };
      return { ...prev, keyProjects: updated };
    });
  };

  // Education management
  const handleAddEducation = () => {
    setParsedData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degree: '',
          institution: '',
          year: '',
        },
      ],
    }));
  };

  const handleUpdateEducation = (index, field, value) => {
    setParsedData((prev) => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  };

  const handleDeleteEducation = (index) => {
    const edu = parsedData.education[index];
    const eduName = edu?.degree ? `${edu.degree} (${edu.institution || ''})` : `Education Record #${index + 1}`;
    setDeleteModal({
      isOpen: true,
      title: 'Delete Education Entry',
      itemName: eduName,
      description: `Are you sure you want to remove "${eduName}" from your education qualifications?`,
      confirmText: 'Delete Education',
      isDeleting: false,
      onConfirm: () => {
        setParsedData((prev) => ({
          ...prev,
          education: prev.education.filter((_, i) => i !== index),
        }));
        setMessage({ text: `Education entry "${eduName}" removed. Click "Save Profile Details" to persist.`, type: 'success' });
        setDeleteModal({ isOpen: false, isDeleting: false, onConfirm: null });
      },
    });
  };

  const handleDeleteResumeFile = () => {
    setDeleteModal({
      isOpen: true,
      title: 'Delete Uploaded Resume File',
      itemName: resume?.fileName || 'Current Resume PDF',
      description: 'Are you sure you want to permanently delete your uploaded resume document from the server?',
      confirmText: 'Delete Resume File',
      isDeleting: false,
      onConfirm: async () => {
        setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
        try {
          const res = await api.delete('/resume');
          if (res.data?.success) {
            setResume(null);
            setMessage({ text: 'Resume file deleted successfully from the server.', type: 'success' });
          }
        } catch (err) {
          setMessage({ text: err.response?.data?.message || 'Failed to delete resume file', type: 'error' });
        } finally {
          setDeleteModal({ isOpen: false, isDeleting: false, onConfirm: null });
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-500 dark:text-zinc-500">
        Loading candidate dossier...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto relative pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            Resume & Candidate Dossier
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Fill details manually or upload a resume to auto-extract. All fields are 100% editable and used by AI for recruiter pitches.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveProfile}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs shadow-md transition-all disabled:opacity-50 self-start sm:self-auto hover:scale-[1.01]"
        >
          {saving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : justSaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span className="text-emerald-500 dark:text-emerald-400">Profile Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile Details</span>
            </>
          )}
        </button>
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

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs w-full sm:w-fit overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all flex-1 sm:flex-none whitespace-nowrap ${
            activeTab === 'editor'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Manual Entry<span className="hidden sm:inline"> & Edit Details</span></span>
          {(parsedData.fullName || parsedData.skills.length > 0) && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg font-medium transition-all flex-1 sm:flex-none whitespace-nowrap ${
            activeTab === 'upload'
              ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Resume<span className="hidden sm:inline"> (AI Auto-Parse)</span></span>
          {resume?.fileName && (
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 dark:bg-zinc-700 rounded text-slate-600 dark:text-zinc-300 font-mono">
              PDF
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: UPLOAD & AUTO-PARSE */}
      {activeTab === 'upload' && (
        <div className="saas-card p-6 border-dashed border-slate-300 dark:border-zinc-800 text-center space-y-4">
          <form onSubmit={handleUpload} className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400">
              <Upload className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                {resume ? 'Upload an Updated Resume Version' : 'Upload your Resume File'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
                Supported formats: PDF or Plain Text. Gemini AI will automatically extract and pre-fill your dossier.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <input
                type="file"
                id="resume-file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="resume-file"
                className="px-3.5 py-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium cursor-pointer transition-colors shadow-xs"
              >
                {selectedFile ? selectedFile.name : 'Choose PDF / TXT File'}
              </label>

              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 text-xs font-semibold disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{uploading ? 'Extracting with Gemini...' : 'Extract Profile'}</span>
              </button>
            </div>

            {resume?.fileName && (
              <div className="pt-2 flex items-center justify-center gap-2.5 text-[11px]">
                <span className="text-slate-500 dark:text-zinc-400">
                  Currently loaded: <span className="font-mono text-slate-700 dark:text-zinc-300 font-medium">{resume.fileName}</span>
                </span>
                <button
                  type="button"
                  onClick={handleDeleteResumeFile}
                  className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete File</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 2: MANUAL ENTRY & EDIT DETAILS */}
      <div className={`space-y-6 ${activeTab === 'upload' ? 'opacity-70 pointer-events-none' : ''}`}>
        {/* SECTION 1: Personal & Contact Information */}
        <div className="saas-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-zinc-800">
            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Personal & Candidate Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Alex Morgan"
                value={parsedData.fullName}
                onChange={(e) => setParsedData({ ...parsedData, fullName: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="alex.morgan@example.com"
                value={parsedData.email}
                onChange={(e) => setParsedData({ ...parsedData, email: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="+91 9876543210"
                value={parsedData.phone}
                onChange={(e) => setParsedData({ ...parsedData, phone: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Current / Target Technical Role
              </label>
              <input
                type="text"
                placeholder="e.g. Full-Stack Developer (MERN)"
                value={parsedData.currentRole}
                onChange={(e) => setParsedData({ ...parsedData, currentRole: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 dark:text-zinc-300 font-medium text-xs">
                  Experience
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const next = !parsedData.isFresher;
                    setParsedData({
                      ...parsedData,
                      isFresher: next,
                      experienceYears: next ? 0 : (parsedData.experienceYears || 0),
                      experienceMonths: next ? 0 : (parsedData.experienceMonths || 0),
                    });
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all border cursor-pointer ${
                    parsedData.isFresher
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:border-indigo-400'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  {parsedData.isFresher ? '✓ Fresher / 0 YOE' : 'Fresher? Click here'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">
                    Years
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    disabled={parsedData.isFresher}
                    placeholder="Years (e.g. 1)"
                    value={parsedData.isFresher ? 0 : (parsedData.experienceYears ?? 0)}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      setParsedData({
                        ...parsedData,
                        experienceYears: val,
                        isFresher: false,
                      });
                    }}
                    className={`w-full px-3 py-1.5 rounded-lg saas-input text-xs font-mono ${
                      parsedData.isFresher ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-zinc-900' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">
                    Months
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="11"
                    disabled={parsedData.isFresher}
                    placeholder="Months (0-11)"
                    value={parsedData.isFresher ? 0 : (parsedData.experienceMonths ?? 0)}
                    onChange={(e) => {
                      const val = Math.min(11, Math.max(0, parseInt(e.target.value, 10) || 0));
                      setParsedData({
                        ...parsedData,
                        experienceMonths: val,
                        isFresher: false,
                      });
                    }}
                    className={`w-full px-3 py-1.5 rounded-lg saas-input text-xs font-mono ${
                      parsedData.isFresher ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-zinc-900' : ''
                    }`}
                  />
                </div>
              </div>

              {parsedData.isFresher ? (
                <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium flex items-center gap-1">
                  <span>🎓</span> Configured as <strong>Fresher / Recent Graduate</strong>. Pitch emails will highlight hands-on projects, eagerness, and core stack skills.
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1">
                  Total: {parsedData.experienceYears || 0} yr{parsedData.experienceYears !== 1 ? 's' : ''} {parsedData.experienceMonths || 0} mo
                </p>
              )}
            </div>
          </div>

          {/* Professional Summary */}
          <div className="pt-2 text-xs">
            <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
              Professional Summary / Elevator Pitch
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary of your technical background, core focus areas, and engineering impact..."
              value={parsedData.summary}
              onChange={(e) => setParsedData({ ...parsedData, summary: e.target.value })}
              className="w-full px-3 py-2 rounded-lg saas-input text-xs leading-relaxed"
            />
          </div>
        </div>

        {/* SECTION 2: Online Profiles & URLs */}
        <div className="saas-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Online Profiles & Links
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {resume?.hasFile && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-medium">
                  <Check className="w-3 h-3" /> PDF Ready to Attach ({resume.fileName})
                </span>
              )}
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                Directly referenced in AI pitches without spam bracket placeholders
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Cloud Resume (Google Drive)
              </label>
              <input
                type="text"
                placeholder="https://drive.google.com/..."
                value={parsedData.links?.resume || ''}
                onChange={(e) =>
                  setParsedData({
                    ...parsedData,
                    links: { ...parsedData.links, resume: e.target.value.trim() },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg saas-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                GitHub Profile URL
              </label>
              <input
                type="text"
                placeholder="https://github.com/username"
                value={parsedData.links?.github || ''}
                onChange={(e) =>
                  setParsedData({
                    ...parsedData,
                    links: { ...parsedData.links, github: e.target.value.trim() },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg saas-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                LinkedIn Profile URL
              </label>
              <input
                type="text"
                placeholder="https://linkedin.com/in/username"
                value={parsedData.links?.linkedin || ''}
                onChange={(e) =>
                  setParsedData({
                    ...parsedData,
                    links: { ...parsedData.links, linkedin: e.target.value.trim() },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg saas-input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">
                Portfolio Website
              </label>
              <input
                type="text"
                placeholder="https://yourportfolio.dev"
                value={parsedData.links?.portfolio || ''}
                onChange={(e) =>
                  setParsedData({
                    ...parsedData,
                    links: { ...parsedData.links, portfolio: e.target.value.trim() },
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg saas-input text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Technical Skills */}
        <div className="saas-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Technical Skills & Competencies ({parsedData.skills?.length || 0})
              </h2>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              Matched against recruiter job descriptions
            </span>
          </div>

          {/* Active Skills Badges */}
          <div className="flex flex-wrap gap-2 min-h-[38px] p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800">
            {parsedData.skills && parsedData.skills.length > 0 ? (
              parsedData.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-white text-slate-800 border border-slate-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200 shadow-2xs font-medium"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-rose-500 dark:text-zinc-500 dark:hover:text-rose-400 transition-colors ml-0.5"
                    title={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 dark:text-zinc-600 italic">
                No skills added yet. Type below or click popular suggestions to add.
              </span>
            )}
          </div>

          {/* Add Skill Input */}
          <div className="flex gap-2 max-w-sm pt-1">
            <input
              type="text"
              placeholder="e.g. Next.js, Redis, Docker..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg saas-input"
            />
            <button
              type="button"
              onClick={() => handleAddSkill()}
              className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 rounded-lg text-xs font-semibold transition-all shadow-xs"
            >
              Add Skill
            </button>
          </div>

          {/* Popular Suggestions */}
          <div className="pt-2">
            <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mb-1.5">
              Quick Suggestions (Click to add):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_SKILLS.filter((s) => !parsedData.skills.includes(s)).map((skill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddSkill(skill)}
                  className="px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-zinc-900 hover:bg-slate-200 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-800 transition-colors"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4: Highlighted Projects (Full Add / Edit / Delete) */}
        <div className="saas-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Key Highlighted Projects ({parsedData.keyProjects?.length || 0})
              </h2>
            </div>
            <button
              type="button"
              onClick={handleAddProject}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project</span>
            </button>
          </div>

          <div className="space-y-4">
            {parsedData.keyProjects && parsedData.keyProjects.length > 0 ? (
              parsedData.keyProjects.map((proj, pIdx) => (
                <div
                  key={pIdx}
                  className="p-4 sm:p-5 rounded-xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 space-y-3.5 text-xs relative group"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-zinc-800/60">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-slate-700 dark:text-zinc-300 font-mono">
                        {pIdx + 1}
                      </span>
                      Project Details
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(pIdx)}
                      className="text-slate-400 hover:text-rose-500 dark:text-zinc-500 dark:hover:text-rose-400 p-1 transition-colors flex items-center gap-1 text-[11px]"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-zinc-400 font-medium mb-1">
                        Project Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Distributed Asynchronous Task Queue"
                        value={proj.title || ''}
                        onChange={(e) => handleUpdateProject(pIdx, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-zinc-400 font-medium mb-1">
                        Live Demo / GitHub Repo Link
                      </label>
                      <input
                        type="text"
                        placeholder="https://github.com/username/project"
                        value={proj.link || ''}
                        onChange={(e) => handleUpdateProject(pIdx, 'link', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg saas-input text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-zinc-400 font-medium mb-1">
                      Brief Description
                    </label>
                    <textarea
                      rows={2}
                      placeholder="What does this project do? e.g. High-throughput distributed task worker with Redis persistence and WebSocket telemetry."
                      value={proj.description || ''}
                      onChange={(e) => handleUpdateProject(pIdx, 'description', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg saas-input text-xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-zinc-400 font-medium mb-1">
                      Key Technical Highlight / Metric (Appears in Email Pitches)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Optimized database queries reducing API latency by 45% using MongoDB aggregations"
                      value={proj.highlights || ''}
                      onChange={(e) => handleUpdateProject(pIdx, 'highlights', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                    />
                  </div>

                  {/* Tech stack for this project */}
                  <div>
                    <label className="block text-slate-600 dark:text-zinc-400 font-medium mb-1.5">
                      Tech Stack Used in Project
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(proj.techStack || []).map((t, tIdx) => (
                        <span
                          key={tIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 font-medium"
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() => handleRemoveProjectTech(pIdx, t)}
                            className="text-slate-400 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2 max-w-xs">
                      <input
                        type="text"
                        placeholder="Add tech (e.g. React)..."
                        value={projectTechInputs[pIdx] || ''}
                        onChange={(e) =>
                          setProjectTechInputs((prev) => ({ ...prev, [pIdx]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddProjectTech(pIdx);
                          }
                        }}
                        className="flex-1 px-2.5 py-1 text-xs rounded-lg saas-input"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddProjectTech(pIdx)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white rounded-lg text-xs font-medium border border-slate-200 dark:border-zinc-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-600 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-900/30 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
                <Briefcase className="w-6 h-6 mx-auto mb-2 text-slate-400 dark:text-zinc-500" />
                No projects listed. Click "Add Project" above to showcase your engineering achievements.
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: Education (Full Add / Edit / Delete) */}
        <div className="saas-card p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Education & Qualifications ({parsedData.education?.length || 0})
              </h2>
            </div>
            <button
              type="button"
              onClick={handleAddEducation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Education</span>
            </button>
          </div>

          <div className="space-y-3">
            {parsedData.education && parsedData.education.length > 0 ? (
              parsedData.education.map((edu, eIdx) => (
                <div
                  key={eIdx}
                  className="p-4 rounded-xl bg-slate-50/70 dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 text-xs space-y-3"
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60 dark:border-zinc-800/60">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">
                      Degree / Academic Background #{eIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteEducation(eIdx)}
                      className="text-slate-400 hover:text-rose-500 dark:text-zinc-500 dark:hover:text-rose-400 p-1 text-[11px] flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-zinc-400 font-medium mb-1">Degree / Course</label>
                      <input
                        type="text"
                        placeholder="e.g. B.Tech Computer Science"
                        value={edu.degree || ''}
                        onChange={(e) => handleUpdateEducation(eIdx, 'degree', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-zinc-400 font-medium mb-1">Institution / University</label>
                      <input
                        type="text"
                        placeholder="e.g. State University / Stanford / MIT"
                        value={edu.institution || ''}
                        onChange={(e) => handleUpdateEducation(eIdx, 'institution', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg saas-input text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-zinc-400 font-medium mb-1">Year / Period</label>
                      <input
                        type="text"
                        placeholder="e.g. 2021 - 2025"
                        value={edu.year || ''}
                        onChange={(e) => handleUpdateEducation(eIdx, 'year', e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg saas-input text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-600 dark:text-zinc-400 bg-slate-50/50 dark:bg-zinc-900/30 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800">
                No education history added. Click "Add Education" above.
              </div>
            )}
          </div>
        </div>

        {/* Floating Save Action Bar */}
        <div className="saas-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md sticky bottom-4 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md">
          <div className="text-xs text-slate-500 dark:text-zinc-400">
            {message.text ? (
              <span className={message.type === 'success' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-600'}>
                {message.text}
              </span>
            ) : (
              <span>All details are synced with Gemini AI cold outreach email generation.</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs shadow-md transition-all disabled:opacity-50 hover:scale-[1.01]"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : justSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span className="text-emerald-500 dark:text-emerald-400">Profile Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

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
