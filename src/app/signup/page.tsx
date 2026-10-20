'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, Mail, Lock, User, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteInfo, setInviteInfo] = useState<{
    valid: boolean;
    role?: string;
    invitedEmail?: string | null;
    reason?: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleValidateCode(codeToValidate: string, emailToValidate?: string) {
    if (!codeToValidate.trim()) {
      setInviteInfo(null);
      return;
    }
    try {
      const res = await fetch('/api/auth/validate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: codeToValidate, email: emailToValidate || email }),
      });
      const data = await res.json();
      setInviteInfo(data);
    } catch {
      setInviteInfo({ valid: false, reason: 'Could not validate invitation code.' });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        setLoading(false);
        return;
      }

      const signInRes = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push('/signin');
        return;
      }

      router.push('/onboard/profile');
      router.refresh();
    } catch {
      setError('Failed to complete registration.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8F8F7] px-4 py-8">
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <Link href="/signin" className="flex items-center gap-2.5 font-semibold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-[#191918] text-white flex items-center justify-center font-bold">
            F
          </div>
          <span>fabric</span>
        </Link>
        <Link
          href="/signin"
          className="px-3.5 py-1.5 rounded-lg bg-white border border-[#E6E6E3] text-sm font-medium hover:bg-[#F3F3F1] transition"
        >
          Sign in
        </Link>
      </header>

      <main className="w-full max-w-md mx-auto bg-white border border-[#E6E6E3] rounded-2xl shadow-sm p-8 my-6">
        <div className="text-center mb-6">
          <div className="w-11 h-11 rounded-2xl bg-[#191918] text-white flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-5 h-5 text-[#45BAF9]" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#191918]">Create your Fabric account</h1>
          <p className="text-sm text-[#6B6B68] mt-1">
            Enter your single-use invitation code to join
          </p>
        </div>

        {error && (
          <div
            data-testid="signup-error"
            className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#6B6B68] mb-1.5">
              Invitation Code <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                data-testid="signup-invite-code"
                type="text"
                required
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onBlur={() => handleValidateCode(inviteCode)}
                placeholder="FBRC-XXXX-XXXX-XXXX"
                className="flex-1 px-3.5 py-2.5 text-sm font-mono uppercase rounded-xl border border-[#E6E6E3] bg-[#F8F8F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#191918]/15"
              />
              <button
                data-testid="validate-invite-btn"
                type="button"
                onClick={() => handleValidateCode(inviteCode)}
                className="px-3.5 py-2 text-xs font-medium rounded-xl border border-[#E6E6E3] bg-[#F3F3F1] hover:bg-[#E6E6E3] transition"
              >
                Verify
              </button>
            </div>
            {inviteInfo && (
              <div
                data-testid="invite-validation-status"
                className={`mt-2 text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
                  inviteInfo.valid
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}
              >
                {inviteInfo.valid ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Valid invitation • Assigned role: <strong>{inviteInfo.role}</strong>
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{inviteInfo.reason}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6B6B68] mb-1.5">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-[#9B9B97] absolute left-3.5 top-3" />
              <input
                data-testid="signup-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6B6B68] mb-1.5">Work or Personal Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9B9B97] absolute left-3.5 top-3" />
              <input
                data-testid="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#6B6B68] mb-1.5">
              Password (minimum 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9B9B97] absolute left-3.5 top-3" />
              <input
                data-testid="signup-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7] focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <button
            data-testid="signup-submit"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#191918] hover:bg-[#2c2c2a] text-white font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <span>{loading ? 'Creating workspace...' : 'Redeem Invite & Continue'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </main>

      <footer className="text-center text-xs text-[#9B9B97]">
        Single-use invitation tokens are hashed with SHA-256 and audited.
      </footer>
    </div>
  );
}
