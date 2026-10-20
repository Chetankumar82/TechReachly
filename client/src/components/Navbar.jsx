import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Logo from './Logo';
import {
  LayoutDashboard,
  Users,
  FileText,
  Send,
  Settings,
  LogOut,
  Plus,
  Sparkles,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  // Detect scroll to apply backdrop depth
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userDropdownOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isSmtpConfigured = Boolean(
    user?.smtpConfig?.authUser && (user?.smtpConfig?.authPass || user?.smtpConfig?.verified)
  );

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'HR Directory', path: '/directory', icon: Users },
    { name: 'Resume Dossier', path: '/resume', icon: FileText },
    { name: 'Campaigns', path: '/campaigns', icon: Send },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled
          ? 'bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-800/80 shadow-md shadow-slate-900/5 dark:shadow-black/30'
          : 'bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-slate-200/60 dark:border-zinc-800/60'
      }`}
    >
      {/* Top Fiber-Optic Gradient Sheen Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/60 via-purple-500/70 via-cyan-400/60 to-transparent animate-reach-gradient" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Desktop Navigation */}
          <div className="flex items-center gap-6 xl:gap-8">
            <Link
              to="/"
              className="focus:outline-none flex items-center gap-2 py-1 select-none"
            >
              <Logo size="sm" badgeText="v1.0" />
            </Link>

            {/* Desktop Navigation Links (≥ 1024px) */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                      isActive
                        ? 'text-slate-900 dark:text-white bg-slate-100 dark:bg-zinc-800/80 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-indigo-600 dark:text-cyan-400'
                          : 'text-slate-400 dark:text-zinc-500'
                      }`}
                    />
                    <span>{item.name}</span>

                    {/* Active Accent Underline Indicator */}
                    {isActive && (
                      <span className="absolute bottom-1 inset-x-3.5 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions, Telemetry, Controls & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mailbox Telemetry Beacon */}
            <Link
              to="/settings"
              title={
                isSmtpConfigured
                  ? 'SMTP Mailbox Connected • Click to inspect deliverability'
                  : 'Mailbox Not Configured • Click to connect SMTP'
              }
              className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                isSmtpConfigured
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {isSmtpConfigured ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </>
                ) : (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </>
                )}
              </span>
              <span className="tracking-tight hidden md:inline">
                {isSmtpConfigured ? 'Mailbox Live' : 'Setup Mailbox'}
              </span>
            </Link>

            {/* "+ New Outreach" Primary Action Button */}
            <Link
              to="/campaign/new"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right transition-all duration-300 shadow-sm shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-200" />
              <span className="hidden sm:inline">New Outreach</span>
              <span className="sm:hidden">New</span>
            </Link>

            {/* Theme Toggle (Light / Dark Mode) */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700/60 transition-all duration-150"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform duration-200" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 hover:-rotate-12 transition-transform duration-200" />
              )}
            </button>

            {/* User Profile Avatar & Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-800 transition-all duration-150"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1.5px]">
                  <div className="w-full h-full rounded-full bg-slate-900 dark:bg-zinc-950 flex items-center justify-center text-white font-bold text-[11px] uppercase">
                    {user?.name ? user.name[0] : 'U'}
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-800 dark:text-zinc-200 max-w-[85px] truncate hidden md:inline">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 dark:text-zinc-500 transition-transform duration-150 ${
                    userDropdownOpen ? 'rotate-180 text-indigo-500' : ''
                  }`}
                />
              </button>

              {/* Glassmorphic Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 slide-in-from-top-1 duration-150">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
                    <p className="font-semibold text-slate-900 dark:text-white truncate text-xs flex items-center gap-1.5">
                      <span>{user?.name}</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    </p>
                    <p className="truncate text-[11px] text-slate-400 dark:text-zinc-400 font-mono mt-0.5">
                      {user?.email}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                      <span>Account Settings</span>
                    </Link>

                    <Link
                      to="/campaigns"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Active Cadences</span>
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-zinc-800">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile / Tablet Menu Button (< 1024px) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-cyan-400 font-semibold border border-indigo-500/20'
                      : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Mailbox Status */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between p-2.5 rounded-xl text-xs border ${
                isSmtpConfigured
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isSmtpConfigured ? 'bg-emerald-400' : 'bg-amber-400'
                  }`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    isSmtpConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                </span>
                <span className="font-medium">
                  {isSmtpConfigured ? 'SMTP Mailbox Active' : 'Configure Mailbox'}
                </span>
              </div>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/60 dark:bg-black/40">
                {isSmtpConfigured ? 'Live' : 'Action Req'}
              </span>
            </Link>
          </div>

          {/* Mobile User & Settings */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs px-1">
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 font-medium"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5 font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
