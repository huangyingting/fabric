'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, KeyRound, Lock } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to request password reset.');
      } else {
        if (data.resetToken) {
          setResetToken(data.resetToken);
        }
        setSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm',
          token: resetToken.trim(),
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password.');
      } else {
        setCompleted(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8F7] px-4">
      <div className="w-full max-w-md bg-white border border-[#E6E6E3] rounded-2xl shadow-sm p-8">
        <Link href="/signin" className="inline-flex items-center gap-1.5 text-xs text-[#6B6B68] hover:text-[#191918] mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to sign in</span>
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight mb-1">Reset your password</h1>
        <p className="text-sm text-[#6B6B68] mb-6">
          Enter the email associated with your Fabric account or redeem a recovery token.
        </p>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {completed ? (
          <div
            data-testid="password-reset-completed"
            className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-medium">Password updated successfully</p>
                <p className="text-xs mt-1">
                  Your credential has been updated and audited. You can now sign in with your new password.
                </p>
              </div>
            </div>
            <Link
              href="/signin"
              className="inline-block px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium"
            >
              Return to sign in
            </Link>
          </div>
        ) : submitted ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="font-medium">Password reset instructions queued</p>
                <p className="text-xs mt-1">
                  If an account exists for <strong>{email}</strong>, a 1-hour recovery token has been issued. Complete the reset below:
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmReset} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#6B6B68] mb-1">Recovery Token</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#9B9B97] absolute left-3.5 top-3" />
                  <input
                    data-testid="reset-token-input"
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="RST-..."
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs font-mono rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B68] mb-1">New Password (min 8 chars)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#9B9B97] absolute left-3.5 top-3" />
                  <input
                    data-testid="reset-new-password-input"
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
                  />
                </div>
              </div>
              <button
                data-testid="confirm-password-reset-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#191918] text-white text-sm font-medium hover:bg-[#2c2c2a]"
              >
                {loading ? 'Updating...' : 'Set new password'}
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#6B6B68] mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9B9B97] absolute left-3.5 top-3" />
                <input
                  data-testid="reset-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@work.com"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
                />
              </div>
            </div>
            <button
              data-testid="send-reset-link-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#191918] text-white text-sm font-medium hover:bg-[#2c2c2a]"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
