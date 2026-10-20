'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
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
          Enter the email associated with your Fabric account or contact your workspace Admin.
        </p>

        {submitted ? (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800 flex items-start gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            <div>
              <p className="font-medium">Password reset instructions queued</p>
              <p className="text-xs mt-1">
                If an account exists for <strong>{email}</strong>, instructions have been recorded. You can also update your password inside Settings → Account.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#6B6B68] mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#9B9B97] absolute left-3.5 top-3" />
                <input
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
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-[#191918] text-white text-sm font-medium hover:bg-[#2c2c2a]"
            >
              Send reset link
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
