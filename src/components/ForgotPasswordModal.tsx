'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, KeyRound, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  onOpenLogin,
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot-password', email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate reset code');

      setSuccessMsg('A reset code has been sent to your email. Enter it below.');
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');

      setSuccessMsg('Your password has been reset! Please sign in with your new password.');
      setTimeout(() => {
        onClose();
        onOpenLogin();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
    >
      <div className="w-full max-w-lg max-h-[70vh] bg-(--bg-surface) border border-(--border-color) rounded-xl shadow-2xl overflow-hidden p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between gap-2 border-b border-(--border-color)  pb-3">
          <h2 id="forgot-password-title" className="text-xl font-bold text-(--text-main) flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 text-(--primary)" />
            <span>Reset Your Password</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-(--text-muted) hover:text-(--text-main) hover:bg-(--bg-surface-hover) focus-ring"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm flex items-center  space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-500 text-sm flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <p className="text-sm text-(--text-muted)">
              Enter your registered email address below. We'll generate a verification code to reset your password.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-(--text-muted)">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-(--text-muted)" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-(--bg-card) border border-(--border-color) rounded-lg text-(--text-main) focus-ring"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-(--primary) text-(--primary-contrast) font-semibold rounded-lg hover:opacity-90 transition-opacity focus-ring disabled:opacity-50 text-sm shadow-md"
            >
              {loading ? 'Sending code...' : 'Generate Reset Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-(--text-muted)">
              Enter the 6-digit code sent to your email address.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-(--text-muted)">6-Digit Verification PIN Code</label>
              <input
                type="text"
                required
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-(--bg-card) border border-(--border-color) rounded-lg text-(--text-main) font-mono tracking-widest focus-ring"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-(--text-muted)">New Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-3 text-(--text-muted)" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-(--bg-card) border border-(--border-color) rounded-lg text-(--text-main) focus-ring"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-(--primary) text-(--primary-contrast) font-semibold rounded-lg hover:opacity-90 btn-interactive focus-ring disabled:opacity-50 text-sm shadow-md"
            >
              {loading ? 'Updating password...' : 'Save New Password & Sign In'}
            </button>
          </form>
        )}

        <div className="text-center pt-2 text-xs text-(--text-muted)">
          Remembered your password?{' '}
          <button
            onClick={() => {
              onClose();
              onOpenLogin();
            }}
            className="font-semibold text-(--primary) hover:underline btn-interactive focus-ring"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
