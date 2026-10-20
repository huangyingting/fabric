'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export default function WorkspacePricingPage() {
  const { workspaceSlug, workspace, refreshWorkspace } = useWorkspace();
  const [annual, setAnnual] = useState(true);

  async function selectPlan(planTier: string) {
    await fetch('/api/workspaces', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceSlug, planTier }),
    });
    await refreshWorkspace();
  }

  return (
    <div data-testid="workspace-pricing-page" className="max-w-5xl mx-auto p-6 sm:p-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#191918]">
          Upgrade your second brain
        </h1>
        <p className="text-sm text-[#6B6B68]">
          Current workspace plan: <strong className="uppercase">{workspace?.planTier || 'free'}</strong>
        </p>
        <div className="inline-flex items-center gap-2 p-1 rounded-xl bg-white border border-[#E6E6E3] mt-2">
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`px-3 py-1 rounded-lg text-xs font-medium ${
              annual ? 'bg-[#191918] text-white' : 'text-[#6B6B68]'
            }`}
          >
            Annual (Save 25%)
          </button>
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`px-3 py-1 rounded-lg text-xs font-medium ${
              !annual ? 'bg-[#191918] text-white' : 'text-[#6B6B68]'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            id: 'free',
            name: 'Fabric Free',
            price: '$0',
            features: ['Up to 5 GB storage', 'Multimodal notes & canvases', 'Rue AI Assistant'],
          },
          {
            id: 'pro',
            name: 'Fabric Pro',
            price: annual ? '$8 / mo' : '$11 / mo',
            features: [
              '500 GB cloud storage',
              'Unlimited Copilot SDK & Azure OpenAI models',
              'Autonomous Scheduled AI Agents',
              'All 13 cloud app integrations',
            ],
          },
          {
            id: 'teams',
            name: 'Fabric Teams',
            price: annual ? '$16 / user' : '$20 / user',
            features: [
              '2 TB shared workspace storage',
              'Invite-only RBAC (Admin, Editor, Viewer)',
              'Security Audit Logs & revocation',
              'Dedicated Azure OpenAI endpoint',
            ],
          },
        ].map((tier) => (
          <div
            key={tier.id}
            className="p-6 rounded-2xl bg-white border border-[#E6E6E3] flex flex-col justify-between gap-6 shadow-xs"
          >
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-base">{tier.name}</h3>
                <div className="text-2xl font-bold mt-1">{tier.price}</div>
              </div>
              <ul className="space-y-2 text-xs text-[#6B6B68]">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              data-testid={`select-plan-${tier.id}`}
              type="button"
              onClick={() => selectPlan(tier.id)}
              className="w-full py-2.5 rounded-xl bg-[#191918] text-white text-xs font-semibold"
            >
              {workspace?.planTier === tier.id ? 'Current Plan' : `Switch to ${tier.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
