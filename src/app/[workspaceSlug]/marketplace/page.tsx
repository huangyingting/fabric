'use client';

import React from 'react';
import Link from 'next/link';
import { Store, Sparkles, Plug, UploadCloud } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

const TEMPLATES = [
  {
    title: 'Startup Research & Competitive Matrix',
    category: 'Research',
    desc: 'Structured space template for tracking competitors, pricing, and product launches.',
  },
  {
    title: 'Academic Literature Review & PDF Synthesis',
    category: 'Academia',
    desc: 'Pre-configured AI actions and tags for annotating arXiv papers and citations.',
  },
  {
    title: 'Weekly Engineering Architecture Decision Log',
    category: 'Engineering',
    desc: 'ADR template with spatial architecture canvas and automated weekly digest agent.',
  },
  {
    title: 'Creative Moodboard & Visual Direction',
    category: 'Design',
    desc: 'Masonry gallery space with color-swatch filtering and spatial image feedback pins.',
  },
];

export default function WorkspaceMarketplacePage() {
  const { workspaceSlug, createQuickResource } = useWorkspace();

  return (
    <div data-testid="marketplace-page" className="max-w-6xl mx-auto p-6 sm:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#E6E6E3] flex items-center justify-center">
            <Store className="w-5 h-5 text-[#191918]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#191918]">Fabric Marketplace</h1>
            <p className="text-xs text-[#6B6B68]">
              Discover community templates, AI agent workflows, and third-party connectors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/${workspaceSlug}/marketplace/import`}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E6E6E3] text-xs font-medium flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" /> Import Tools
          </Link>
          <Link
            href={`/${workspaceSlug}/connections`}
            className="px-3.5 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium flex items-center gap-1.5"
          >
            <Plug className="w-3.5 h-3.5" /> Browse Connections
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEMPLATES.map((tpl) => (
          <div
            key={tpl.title}
            className="p-5 rounded-2xl bg-white border border-[#E6E6E3] flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#F3F3F1] text-[10px] font-semibold uppercase">
                {tpl.category}
              </span>
              <h3 className="font-semibold text-base text-[#191918]">{tpl.title}</h3>
              <p className="text-xs text-[#6B6B68]">{tpl.desc}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                createQuickResource({
                  kind: 'notepad',
                  name: tpl.title,
                  content: `# ${tpl.title}\n\n${tpl.desc}\n\n## Action Items\n- [ ] Customize template for your team`,
                  openAfterCreate: true,
                })
              }
              className="self-start px-3.5 py-1.5 rounded-xl bg-[#191918] text-white text-xs font-medium flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Use Template
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
