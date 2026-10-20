'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Unable to sign in. Please check your credentials.');
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
        <div className="flex items-center gap-3 text-sm">
          <Link href="/pricing" className="text-[#6B6B68] hover:text-[#191918] px-3 py-1.5">
            Pricing
          </Link>
          <Link href="/marketplace" className="text-[#6B6B68] hover:text-[#191918] px-3 py-1.5">
            Marketplace
          </Link>
          <Link
            href="/signup"
            className="px-3.5 py-1.5 rounded-lg bg-white border border-[#E6E6E3] font-medium hover:bg-[#F3F3F1] transition"
          >
            Redeem Invite
          </Link>
        </div>
      </header>

      <main className="w-full max-w-md mx-auto bg-white border border-[#E6E6E3] rounded-2xl shadow-sm p-8 my-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-11 h-11 rounded-2xl bg-[#191918] text-white flex items-center justify-center mb-3 shadow-sm">
            <Sparkles className="w-5 h-5 text-[#45BAF9]" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#191918]">Sign in to Fabric</h1>
          <p className="text-sm text-[#6B6B68] mt-1">
            Your self-organizing workspace and AI second brain
          </p>
        </div>

        {error && (
          <div
            data-testid="signin-error"
            className="mb-4 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#6B6B68] mb-1.5">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#9B9B97] absolute left-3.5 top-3" />
              <input
                data-testid="signin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@work.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#191918]/15"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-[#6B6B68]">Password</label>
              <Link href="/reset-password" className="text-xs text-[#6B6B68] hover:text-[#191918]">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#9B9B97] absolute left-3.5 top-3" />
              <input
                data-testid="signin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#191918]/15"
              />
            </div>
          </div>

          <button
            data-testid="signin-submit"
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#191918] hover:bg-[#2c2c2a] text-white font-medium text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <span>{loading ? 'Signing in...' : 'Continue with email'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#E6E6E3] flex flex-col gap-2 text-center">
          <div className="inline-flex items-center justify-center gap-1.5 text-xs text-[#6B6B68]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Invite-only workspace admission enabled</span>
          </div>
          <p className="text-xs text-[#6B6B68]">
            Have an invitation code?{' '}
            <Link href="/signup" className="text-[#191918] font-medium underline underline-offset-2">
              Create your account
            </Link>
          </p>
        </div>
      </main>

      <footer className="text-center text-xs text-[#9B9B97]">
        Fabric Workspace • Powered by Pluggable Copilot SDK & Azure OpenAI
      </footer>
    </div>
  );
}
