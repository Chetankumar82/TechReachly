import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Logo from '../components/Logo';
import api from '../services/api';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sun,
  Moon,
  ShieldCheck,
} from 'lucide-react';

const calculateStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[0-9]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd) || /[A-Z]/.test(pwd)) score++;
  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
  if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
  if (score === 3) return { score: 3, label: 'Good', color: 'bg-cyan-500' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
};

export const ResetPasswordPage = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const strength = calculateStrength(password);

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid or missing reset link. Please request a new one.');
    }
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    if (password !== confirm) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', { token, email, password });
      if (res.data?.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(res.data?.message || 'Reset failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Reset link is invalid or has expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen saas-bg text-slate-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-indigo-600 selection:text-white transition-colors duration-200 overflow-x-hidden">
      {/* Header bar */}
      <header className="w-full border-b border-slate-200/80 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md px-4 sm:px-8 py-2.5 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="font-mono text-xs font-semibold text-cyan-600 dark:text-cyan-400">
            SECURE RESET GATEWAY
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-Bit Encrypted Reset</span>
          </div>
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
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="flex justify-center mb-6">
            <Logo variant="full" size="sm" showBadge={true} badgeText="v1.0" />
          </div>

          <div className="w-full bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400" />

            <div className="mb-6">
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                Password Reset
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                Set a new password
              </h2>
              {email && (
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  Resetting password for <strong className="text-slate-700 dark:text-zinc-200">{email}</strong>
                </p>
              )}
            </div>

            {/* Success state */}
            {success ? (
              <div className="space-y-4 text-center py-4">
                <div className="flex justify-center">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Password Updated!</h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400">
                  Your password has been reset successfully. Redirecting you to login…
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 shadow-md"
                >
                  Back to Login <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <>
                {/* Error alert */}
                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  {/* New Password */}
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-zinc-300 font-medium">New Password</label>
                    <div className="relative group">
                      <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-indigo-500 transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Min. 8 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Strength meter */}
                    {password && (
                      <div className="space-y-1 pt-0.5">
                        <div className="grid grid-cols-4 gap-1 h-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-full rounded-full transition-all duration-300 ${
                                strength.score >= i ? strength.color : 'bg-slate-200 dark:bg-zinc-800'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400">
                          Strength: <strong className="text-slate-700 dark:text-zinc-200">{strength.label}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="text-slate-700 dark:text-zinc-300 font-medium">Confirm New Password</label>
                    <div className="relative group">
                      <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-cyan-500 transition-colors" />
                      <input
                        type="password"
                        required
                        placeholder="Repeat password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        className={`w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-zinc-950 border text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-1 transition-all text-xs ${
                          confirm && confirm !== password
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                            : confirm && confirm === password
                            ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500'
                            : 'border-slate-200 dark:border-zinc-800 focus:border-cyan-500 focus:ring-cyan-500'
                        }`}
                      />
                      {confirm && confirm === password && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={loading || !token || !email}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right transition-all duration-300 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group/btn disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Resetting Password…</span>
                        </>
                      ) : (
                        <>
                          <span>Reset Password</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="mt-5 text-center text-xs text-slate-500 dark:text-zinc-400">
                  Remembered your password?{' '}
                  <Link to="/login" className="text-indigo-600 dark:text-cyan-400 font-semibold hover:underline">
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-slate-200/80 dark:border-zinc-900 py-4 px-6 text-center text-[11px] text-slate-400 dark:text-zinc-600">
        TechReachly • Precision Intelligence v2.4 • All Rights Reserved
      </footer>
    </div>
  );
};

export default ResetPasswordPage;
