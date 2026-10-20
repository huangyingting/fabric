'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { Folder, Plus, ArrowLeft } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { ResourceGrid } from '@/components/workspace/ResourceGrid';

export default function SpaceDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; spaceId: string }>;
}) {
  const { workspaceSlug, spaceId } = use(params);
  const { spaces, resources, createQuickResource } = useWorkspace();

  const space = spaces.find((s) => s.id === spaceId);
  const spaceChildren = resources.filter((r) => r.parentId === spaceId);

  return (
    <div data-testid="space-detail-page" className="max-w-7xl mx-auto p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={`/${workspaceSlug}/spaces`}
            className="inline-flex items-center gap-1 text-xs text-[#6B6B68] hover:text-[#191918]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All Spaces
          </Link>
          <div className="flex items-center gap-2.5">
            <Folder className="w-6 h-6 text-amber-500 fill-amber-500" />
            <h1 className="text-2xl font-semibold text-[#191918]">{space?.name || 'Space'}</h1>
          </div>
          {space?.description && <p className="text-xs text-[#6B6B68]">{space.description}</p>}
        </div>

        <div className="flex items-center gap-2">
          <button
            data-testid="space-add-note-btn"
            type="button"
            onClick={() =>
              createQuickResource({
                kind: 'notepad',
                name: 'Untitled space note',
                parentId: spaceId,
                openAfterCreate: true,
              })
            }
            className="px-3.5 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Note to Space
          </button>
        </div>
      </div>

      <ResourceGrid items={spaceChildren} title={`${space?.name || 'Space'} Contents`} />
    </div>
  );
}
