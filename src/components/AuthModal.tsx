'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'register' | 'changePassword';
  onAuthSuccess: (user: any) => void;
  onOpenForgotPassword: () => void;
}

export function AuthModal({
  isOpen,
  onClose,
  initialView = 'login',
  onAuthSuccess,
  onOpenForgotPassword,
}: AuthModalProps) {
  const [view, setView] = useState<'login' | 'register' | 'changePassword'>(initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (view === 'register') {
        if (!email || !password) {
          setError('Please fill in all required fields.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'register', email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        onAuthSuccess(data.user);
        onClose();
      } else if (view === 'login') {
        if (!email || !password) {
          setError('Please enter your email and password.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        onAuthSuccess(data.user);
        onClose();
      } else if (view === 'changePassword') {
        if (!currentPassword || !newPassword) {
          setError('Please fill in both current and new password.');
          setLoading(false);
          return;
        }
        if (newPassword.length < 6) {
          setError('New password must be at least 6 characters.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'change-password', currentPassword, newPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to change password');
        setSuccess('Password updated successfully!');
        setTimeout(() => onClose(), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <h2 id="auth-modal-title" className="text-xl font-bold text-[var(--text-main)] flex items-center space-x-2">
            <Lock className="w-5 h-5 text-[var(--primary)]" />
            <span>
              {view === 'login' && 'Sign In to Inkwell'}
              {view === 'register' && 'Create Your Account'}
              {view === 'changePassword' && 'Change Password'}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] focus-ring"
            aria-label="Close authentication modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-500 text-sm flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {view === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[var(--text-muted)]">Full Name (Optional)</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] focus-ring"
                />
              </div>
            </div>
          )}

          {(view === 'login' || view === 'register') && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] focus-ring"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Password *</label>
                  {view === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenForgotPassword();
                      }}
                      className="text-xs text-[var(--primary)] hover:underline focus-ring"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] focus-ring"
                  />
                </div>
              </div>
            </>
          )}

          {view === 'changePassword' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Current Password *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] focus-ring"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--text-muted)]">New Password *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-3 text-[var(--text-muted)]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] focus-ring"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[var(--primary)] text-[var(--primary-contrast)] font-semibold rounded-lg hover:opacity-90 transition-opacity focus-ring disabled:opacity-50 text-sm shadow-md"
          >
            {loading
              ? 'Processing...'
              : view === 'login'
              ? 'Sign In'
              : view === 'register'
              ? 'Create Account'
              : 'Update Password'}
          </button>
        </form>

        {view !== 'changePassword' && (
          <div className="text-center pt-2 text-xs text-[var(--text-muted)]">
            {view === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setView('register');
                    setError(null);
                  }}
                  className="font-semibold text-[var(--primary)] hover:underline focus-ring"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setView('login');
                    setError(null);
                  }}
                  className="font-semibold text-[var(--primary)] hover:underline focus-ring"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
