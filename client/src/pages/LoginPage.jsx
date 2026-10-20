import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogoSquircle } from '../components/Logo';
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, Sun, Moon } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await login(email, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@techreachly.com');
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen saas-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative transition-colors duration-200">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-sm text-center">
        <LogoSquircle size="lg" className="mx-auto mb-3" />
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Sign in to TechReachly
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          AI-Powered IT Job Outreach & Cadence CRM
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="saas-card py-6 px-6 sm:px-7 space-y-4 shadow-xl">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">Email</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg saas-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-zinc-300 font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg saas-input text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-950 font-semibold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Fill Button */}
          <div className="pt-3 border-t border-slate-100 dark:border-zinc-800 text-center space-y-2.5">
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Auto-fill Demo Credentials
            </button>

            <div className="text-[11px] text-slate-600 dark:text-zinc-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-slate-800 dark:text-zinc-200 hover:underline font-medium">
                Create one
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
