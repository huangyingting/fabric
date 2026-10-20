'use client';

import React, { useState } from 'react';
import { Users, Globe, ExternalLink } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { ResourceGrid } from '@/components/workspace/ResourceGrid';

export default function SharedWithMePage() {
  const { resources } = useWorkspace();
  const [filter, setFilter] = useState<'all' | 'public' | 'team'>('all');

  const nonFolders = resources.filter((r) => r.kind !== 'folder');
  const publicLinks = nonFolders.filter((r) => r.isShared);
  const displayedItems =
    filter === 'public' ? publicLinks : nonFolders;

  return (
    <div data-testid="shared-with-me-page" className="max-w-7xl mx-auto p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#E6E6E3] flex items-center justify-center">
            <Users className="w-4 h-4 text-[#191918]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#191918]">Shared with me</h1>
            <p className="text-xs text-[#6B6B68]">
              Collaborative spaces, notes, and publicly shared links across your workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            data-testid="shared-filter-all"
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${
              filter === 'all'
                ? 'bg-[#191918] text-white border-[#191918]'
                : 'bg-white border-[#E6E6E3] text-[#6B6B68]'
            }`}
          >
            All Shared ({nonFolders.length})
          </button>
          <button
            data-testid="shared-filter-public"
            type="button"
            onClick={() => setFilter('public')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 ${
              filter === 'public'
                ? 'bg-[#191918] text-white border-[#191918]'
                : 'bg-white border-[#E6E6E3] text-[#6B6B68]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public Share Links ({publicLinks.length})</span>
          </button>
        </div>
      </div>

      {publicLinks.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-[#E6E6E3] space-y-2">
          <div className="text-xs font-semibold text-[#191918] flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active Public Share Links</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {publicLinks.map((item) => (
              <a
                key={item.id}
                href={`/share/${item.shareToken || item.id}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#F8F8F7] border border-[#E6E6E3] hover:border-[#191918] text-xs font-medium inline-flex items-center gap-1.5"
              >
                <span>{item.name}</span>
                <ExternalLink className="w-3 h-3 text-[#6B6B68]" />
              </a>
            ))}
          </div>
        </div>
      )}

      <ResourceGrid items={displayedItems} title="Shared Workspace Items" />
    </div>
  );
}
