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
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Brand & Desktop Navigation */}
          <div className="flex items-center gap-8">
            <Link to="/" className="focus:outline-hidden">
              <Logo size="sm" badgeText="v1.0" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-100 dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 shadow-sm'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Actions, Theme Toggle, Status & Profile */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Theme Toggle (Light / Dark Mode) */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Mailbox Status Pill */}
            <Link
              to="/settings"
              title={isSmtpConfigured ? 'SMTP Mailbox Connected' : 'Configure SMTP Mailbox'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                isSmtpConfigured
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSmtpConfigured ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-amber-500 dark:bg-amber-400 animate-pulse'
                }`}
              />
              <span>{isSmtpConfigured ? 'Mailbox Live' : 'Setup Mailbox'}</span>
            </Link>

            {/* Primary Action Button */}
            <Link
              to="/campaign/new"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs transition-all shadow-sm hover:scale-[1.01]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Outreach</span>
            </Link>

            {/* Settings Link */}
            <Link
              to="/settings"
              title="Settings"
              className={`p-1.5 rounded-lg transition-colors ${
                location.pathname === '/settings'
                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-zinc-100'
                  : 'text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-900'
              }`}
            >
              <Settings className="w-4 h-4" />
            </Link>

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-semibold text-[11px] flex items-center justify-center uppercase">
                  {user?.name ? user.name[0] : 'U'}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-zinc-300 max-w-[100px] truncate">
                  {user?.name || 'User'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl py-1 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
                    <p className="font-semibold text-slate-800 dark:text-zinc-200 truncate">{user?.name}</p>
                    <p className="truncate text-[11px] text-slate-400 dark:text-zinc-400 font-mono">{user?.email}</p>
                  </div>
                  <Link
                    to="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-colors"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Account Settings
                  </Link>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Actions: Theme Toggle + Menu */}
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
              className="p-1.5 rounded-lg bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-medium text-xs"
            >
              <Plus className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-900"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                  isActive
                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
              className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
