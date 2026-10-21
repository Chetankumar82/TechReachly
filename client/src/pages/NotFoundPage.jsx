import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo, { LogoMark } from '../components/Logo';
import {
  LayoutDashboard,
  Users,
  FileText,
  Send,
  ArrowLeft,
  Compass,
  Search,
} from 'lucide-react';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  const navigationShortcuts = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, desc: 'Pipeline analytics & deliverability' },
    { name: 'HR Directory', path: '/directory', icon: Users, desc: 'Search & filter verified recruiters' },
    { name: 'Resume Dossier', path: '/resume', icon: FileText, desc: 'Profile skills & PDF intelligence' },
    { name: 'Campaigns', path: '/campaigns', icon: Send, desc: 'Active sequences & reply tracker' },
  ];

  return (
    <div className="min-h-screen saas-bg text-slate-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white transition-colors duration-200 overflow-x-hidden">
      {/* Top Header */}
      <header className="w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md px-4 sm:px-8 py-3.5 z-40 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo variant="full" size="sm" showBadge={true} badgeText="v2.4" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-xs font-medium text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-850 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to App</span>
        </Link>
      </header>

      {/* Main 404 Hero Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="max-w-xl w-full text-center space-y-6">
          {/* Animated Ambient Radar */}
          <div className="relative inline-flex items-center justify-center mb-2">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-slate-200/80 dark:border-zinc-800 flex items-center justify-center shadow-xl relative overflow-hidden">
              <LogoMark className="w-14 h-14" animated={true} />
            </div>
            <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 border border-indigo-500/20">
              404
            </span>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20">
              <Compass className="w-3 h-3" />
              <span>OUT OF RECEPTOR RANGE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Page Not Found
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              The outreach coordinates or cadence URL you requested does not exist or may have been relocated.
            </p>
          </div>

          {/* Quick Route Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-left">
            {navigationShortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className="saas-card p-3.5 rounded-xl hover:border-indigo-400/50 dark:hover:border-indigo-500/50 hover:bg-slate-50/70 dark:hover:bg-zinc-850/60 transition-all group flex items-start gap-3"
                >
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 group-hover:scale-110 transition-transform shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bottom Action */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Previous Page
            </button>
            <Link
              to="/"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 shadow-md hover:shadow-lg transition-all"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200/80 dark:border-zinc-900 py-4 px-6 text-center text-[11px] text-slate-400 dark:text-zinc-600">
        TechReachly • Precision Intelligence v2.4 • All Rights Reserved
      </footer>
    </div>
  );
};

export default NotFoundPage;
