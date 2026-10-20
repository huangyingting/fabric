'use client';

import React from 'react';
import Link from 'next/link';
import { Folder, Plus, FileText, FileCode2, Globe, Sparkles } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { ResourceGrid } from '@/components/workspace/ResourceGrid';

export default function WorkspaceHomePage() {
  const {
    workspaceSlug,
    currentUser,
    spaces,
    resources,
    createQuickResource,
    setActiveCreateModal,
    setAssistantOpen,
  } = useWorkspace();

  const nonFolderResources = resources.filter((r) => r.kind !== 'folder');

  return (
    <div data-testid="workspace-home-page" className="max-w-7xl mx-auto p-6 sm:p-8 space-y-8">
      {/* Top Hero Greeting & Quick Capture */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#191918]">
            Welcome back, {currentUser?.name || 'Creator'}
          </h1>
          <p className="text-xs text-[#6B6B68] mt-1">
            All your notes, documents, media, canvases, and AI knowledge in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            data-testid="home-quick-note-btn"
            type="button"
            onClick={() =>
              createQuickResource({
                kind: 'notepad',
                name: 'Untitled note',
                openAfterCreate: true,
              })
            }
            className="px-3.5 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#2c2c2a]"
          >
            <FileText className="w-3.5 h-3.5" /> New Note
          </button>

          <button
            data-testid="home-quick-canvas-btn"
            type="button"
            onClick={() =>
              createQuickResource({
                kind: 'canvas',
                name: 'Untitled canvas',
                openAfterCreate: true,
              })
            }
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E6E6E3] text-xs font-medium flex items-center gap-1.5 hover:bg-[#F3F3F1]"
          >
            <FileCode2 className="w-3.5 h-3.5 text-purple-600" /> New Canvas
          </button>

          <button
            data-testid="home-quick-link-btn"
            type="button"
            onClick={() => setActiveCreateModal('link')}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E6E6E3] text-xs font-medium flex items-center gap-1.5 hover:bg-[#F3F3F1]"
          >
            <Globe className="w-3.5 h-3.5 text-cyan-600" /> Save Link
          </button>

          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-[#45BAF9]/15 text-[#0284C7] text-xs font-semibold flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" /> Ask Rue
          </button>
        </div>
      </div>

      {/* Spaces Strip */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[#6B6B68]">Spaces</h2>
          <Link href={`/${workspaceSlug}/spaces`} className="text-xs text-[#6B6B68] hover:text-[#191918]">
            View all spaces →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {spaces
            .filter((s) => s.root === 'SPACE')
            .map((space) => (
              <Link
                key={space.id}
                data-testid={`home-space-card-${space.name.toLowerCase().replace(/\s+/g, '-')}`}
                href={`/${workspaceSlug}/spaces/${space.id}`}
                className="p-4 rounded-2xl bg-white border border-[#E6E6E3] hover:border-[#191918]/40 transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Folder className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#191918] truncate">{space.name}</div>
                    <div className="text-[11px] text-[#6B6B68]">
                      {space._count?.children ?? 0} items
                    </div>
                  </div>
                </div>
              </Link>
            ))}

          <button
            type="button"
            onClick={() => setActiveCreateModal('space')}
            className="p-4 rounded-2xl border border-dashed border-[#E6E6E3] hover:border-[#191918] text-xs font-medium text-[#6B6B68] hover:text-[#191918] flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" /> Create new space
          </button>
        </div>
      </div>

      {/* Multimodal Resource Grid */}
      <ResourceGrid items={nonFolderResources} title="Recent Everything" />
    </div>
  );
}
