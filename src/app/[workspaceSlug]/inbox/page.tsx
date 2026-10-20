'use client';

import React from 'react';
import { Inbox, Plus, Globe } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { ResourceGrid } from '@/components/workspace/ResourceGrid';

export default function InboxPage() {
  const { resources, createQuickResource, setActiveCreateModal } = useWorkspace();
  const inboxItems = resources.filter((r) => r.root === 'INBOX' && r.kind !== 'folder');

  return (
    <div data-testid="inbox-page" className="max-w-7xl mx-auto p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#E6E6E3] flex items-center justify-center">
            <Inbox className="w-4 h-4 text-[#191918]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#191918]">Inbox</h1>
            <p className="text-xs text-[#6B6B68]">Unfiled quick captures, links, and voice memos</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCreateModal('link')}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#E6E6E3] text-xs font-medium flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5" /> Clip URL
          </button>
          <button
            type="button"
            onClick={() =>
              createQuickResource({
                kind: 'notepad',
                name: 'Quick Inbox Note',
                root: 'INBOX',
                openAfterCreate: true,
              })
            }
            className="px-3.5 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Quick Note
          </button>
        </div>
      </div>

      <ResourceGrid items={inboxItems} title="Inbox Captures" />
    </div>
  );
}
