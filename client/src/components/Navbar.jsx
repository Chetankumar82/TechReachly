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

  // Detect scroll to enhance glassmorphic depth
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
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 dark:bg-[#09090b]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-zinc-800/80 shadow-md shadow-slate-900/5 dark:shadow-black/30'
          : 'bg-white/70 dark:bg-[#09090b]/70 backdrop-blur-md border-b border-slate-200/60 dark:border-zinc-800/50'
      }`}
    >
      {/* Top Fiber-Optic Gradient Sheen Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-indigo-500/50 via-purple-500/60 via-cyan-400/50 to-transparent animate-reach-gradient" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Brand & Desktop Navigation */}
          <div className="flex items-center gap-7 lg:gap-9">
            {/* Interactive Animated Logo */}
            <Link
              to="/"
              className="focus:outline-hidden group/logo flex items-center gap-2 py-1"
            >
              <Logo size="sm" badgeText="v1.0" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/50 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800/50">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 group/nav ${
                      isActive
                        ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs border border-slate-200/70 dark:border-zinc-700/60 font-semibold'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 transition-transform duration-200 group-hover/nav:scale-110 ${
                        isActive
                          ? 'text-indigo-600 dark:text-cyan-400'
                          : 'text-slate-400 dark:text-zinc-500 group-hover/nav:text-slate-700 dark:group-hover/nav:text-zinc-300'
                      }`}
                    />
                    <span>{item.name}</span>

                    {/* Active Accent Bottom Glow */}
                    {isActive && (
                      <span className="absolute -bottom-1 inset-x-3 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions, Mailbox Beacon, Theme Toggle & Profile */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Mailbox Telemetry Beacon */}
            <Link
              to="/settings"
              title={
                isSmtpConfigured
                  ? 'SMTP Mailbox Active & Verified • Click to Inspect'
                  : 'Mailbox Not Configured • Click to Setup'
              }
              className={`relative inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all duration-300 group ${
                isSmtpConfigured
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.12)]'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.12)]'
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
              <span className="tracking-tight font-medium">
                {isSmtpConfigured ? 'Mailbox Live' : 'Setup Mailbox'}
              </span>
            </Link>

            {/* High-Impact New Outreach Action Button */}
            <Link
              to="/campaign/new"
              className="relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right transition-all duration-500 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] overflow-hidden group/btn"
            >
              {/* Shimmer light sweep reflection */}
              <span className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover/btn:translate-x-[300%] transition-transform duration-1000 ease-out pointer-events-none" />
              <Plus className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:rotate-90 text-cyan-200" />
              <span className="tracking-tight">New Outreach</span>
              <Sparkles className="w-3 h-3 text-cyan-300 opacity-75 group-hover/btn:opacity-100 animate-pulse" />
            </Link>

            {/* Theme Toggle (Light / Dark Mode) with Interactive Spin */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-transparent hover:border-slate-200 dark:hover:border-zinc-700/60 transition-all duration-200 group/theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 group-hover/theme:rotate-45 transition-transform duration-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700 group-hover/theme:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {/* Settings Quick Icon */}
            <Link
              to="/settings"
              title="Settings"
              className={`p-1.5 rounded-lg border transition-all duration-200 group/settings ${
                location.pathname === '/settings'
                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 border-slate-200 dark:border-zinc-700'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 border-transparent hover:border-slate-200 dark:hover:border-zinc-700/60'
              }`}
            >
              <Settings className="w-4 h-4 transition-transform duration-300 group-hover/settings:rotate-45" />
            </Link>

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800/80 hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 group/user"
              >
                {/* Radiant Avatar Halo */}
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1.5px] shadow-xs group-hover/user:shadow-indigo-500/20 transition-shadow">
                  <div className="w-full h-full rounded-full bg-slate-900 dark:bg-zinc-950 flex items-center justify-center text-white font-bold text-[10.5px] uppercase">
                    {user?.name ? user.name[0] : 'U'}
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 max-w-[90px] truncate">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${
                    userDropdownOpen ? 'rotate-180 text-indigo-500' : ''
                  }`}
                />
              </button>

              {/* Elevated Glassmorphism Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-zinc-800 shadow-2xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150">
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
          </div>

          {/* Mobile Actions: Theme + Action + Hamburger */}
          <div className="flex sm:hidden items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
            <Link
              to="/campaign/new"
              className="p-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-xs shadow-xs"
            >
              <Plus className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-indigo-500" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-200/80 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
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

          <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs px-1">
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
