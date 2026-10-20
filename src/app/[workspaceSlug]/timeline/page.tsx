'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { ResourceGrid } from '@/components/workspace/ResourceGrid';

export default function TimelinePage() {
  const { resources } = useWorkspace();
  const sorted = [...resources]
    .filter((r) => r.kind !== 'folder')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div data-testid="timeline-page" className="max-w-7xl mx-auto p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white border border-[#E6E6E3] flex items-center justify-center">
          <Clock className="w-4 h-4 text-[#191918]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#191918]">Timeline</h1>
          <p className="text-xs text-[#6B6B68]">Chronological stream of every captured thought and file</p>
        </div>
      </div>

      <ResourceGrid items={sorted} title="Chronological Feed" />
    </div>
  );
}
