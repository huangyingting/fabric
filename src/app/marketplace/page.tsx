import React from 'react';
import Link from 'next/link';

export default function PublicMarketplacePage() {
  return (
    <div data-testid="public-marketplace-page" className="min-h-screen bg-[#F8F8F7] text-[#191918] p-8">
      <header className="max-w-6xl mx-auto flex items-center justify-between pb-10">
        <Link href="/signin" className="flex items-center gap-2 font-bold text-lg">
          <span className="w-8 h-8 rounded-xl bg-[#191918] text-white flex items-center justify-center">F</span>
          <span>Fabric Marketplace</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/pricing" className="text-xs font-medium text-[#6B6B68] hover:text-[#191918]">
            Pricing
          </Link>
          <Link href="/signin" className="px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium">
            Sign in
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-semibold">Explore Templates, Integrations & AI Workflows</h1>
        <p className="text-sm text-[#6B6B68]">
          Connect Google Drive, Notion, GitHub, Slack, Readwise, and Kindle directly into your workspace.
        </p>
      </main>
    </div>
  );
}
