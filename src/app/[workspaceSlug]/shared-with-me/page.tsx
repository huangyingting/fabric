'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { ResourceGrid } from '@/components/workspace/ResourceGrid';

export default function SharedWithMePage() {
  const { resources } = useWorkspace();
  const sharedItems = resources.filter((r) => r.kind !== 'folder');

  return (
    <div data-testid="shared-with-me-page" className="max-w-7xl mx-auto p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white border border-[#E6E6E3] flex items-center justify-center">
          <Users className="w-4 h-4 text-[#191918]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#191918]">Shared with me</h1>
          <p className="text-xs text-[#6B6B68]">
            Collaborative spaces, notes, and documents shared across your workspace members
          </p>
        </div>
      </div>

      <ResourceGrid items={sharedItems} title="Shared Workspace Items" />
    </div>
  );
}
