'use client';

import React from 'react';
import Link from 'next/link';
import { Folder, Plus } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export default function SpacesIndexPage() {
  const { workspaceSlug, spaces, setActiveCreateModal } = useWorkspace();
  const visibleSpaces = spaces.filter((s) => s.root === 'SPACE');

  return (
    <div data-testid="spaces-page" className="max-w-7xl mx-auto p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#191918]">Spaces</h1>
          <p className="text-xs text-[#6B6B68]">Organize projects, collections, and shared team folders</p>
        </div>
        <button
          data-testid="spaces-create-btn"
          type="button"
          onClick={() => setActiveCreateModal('space')}
          className="px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Create new space
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleSpaces.map((sp) => (
          <Link
            key={sp.id}
            data-testid={`space-directory-card-${sp.id}`}
            href={`/${workspaceSlug}/spaces/${sp.id}`}
            className="p-5 rounded-2xl bg-white border border-[#E6E6E3] hover:border-[#191918]/40 transition space-y-3"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Folder className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-[#191918]">{sp.name}</h3>
              {sp.description && (
                <p className="text-xs text-[#6B6B68] line-clamp-2 mt-1">{sp.description}</p>
              )}
            </div>
            <div className="text-[11px] font-medium text-[#9B9B97]">
              {sp._count?.children ?? 0} resources inside
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
