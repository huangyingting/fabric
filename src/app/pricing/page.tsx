import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

export default function PublicPricingPage() {
  return (
    <div data-testid="public-pricing-page" className="min-h-screen bg-[#F8F8F7] text-[#191918] p-8">
      <header className="max-w-6xl mx-auto flex items-center justify-between pb-10">
        <Link href="/signin" className="flex items-center gap-2 font-bold text-lg">
          <span className="w-8 h-8 rounded-xl bg-[#191918] text-white flex items-center justify-center">F</span>
          <span>Fabric</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/marketplace" className="text-xs font-medium text-[#6B6B68] hover:text-[#191918]">
            Marketplace
          </Link>
          <Link href="/signin" className="px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium">
            Sign in
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold">Simple, transparent pricing</h1>
          <p className="text-sm text-[#6B6B68]">Your AI-native workspace and multimodal second brain</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Free', price: '$0', desc: 'For individuals getting started' },
            { name: 'Pro', price: '$8 / mo', desc: 'For researchers, creators & engineers' },
            { name: 'Teams', price: '$16 / user', desc: 'Invite-only RBAC, Audit Logs & shared spaces' },
          ].map((p) => (
            <div key={p.name} className="p-6 rounded-2xl bg-white border border-[#E6E6E3] space-y-4">
              <h3 className="font-semibold text-lg">{p.name}</h3>
              <div className="text-2xl font-bold">{p.price}</div>
              <p className="text-xs text-[#6B6B68]">{p.desc}</p>
              <div className="flex items-center gap-2 text-xs text-[#191918]">
                <Check className="w-4 h-4 text-emerald-600" /> Pluggable Copilot SDK & Azure OpenAI
              </div>
              <Link
                href="/signup"
                className="block text-center py-2.5 rounded-xl bg-[#191918] text-white text-xs font-medium"
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
