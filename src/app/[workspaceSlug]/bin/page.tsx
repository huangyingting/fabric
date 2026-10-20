'use client';

import React, { useEffect, useState } from 'react';
import { Trash2, RotateCcw } from 'lucide-react';
import { ResourceItem, useWorkspace } from '@/components/workspace/WorkspaceContext';

export default function TrashBinPage() {
  const { workspaceSlug, refreshWorkspace } = useWorkspace();
  const [trashed, setTrashed] = useState<ResourceItem[]>([]);

  async function loadTrashed() {
    const res = await fetch(
      `/api/resources?workspaceSlug=${encodeURIComponent(workspaceSlug)}&trashed=true`
    );
    if (res.ok) {
      const data = await res.json();
      setTrashed(data.resources || []);
    }
  }

  useEffect(() => {
    loadTrashed();
  }, [workspaceSlug]);

  async function handleTrashAction(resourceId: string, action: 'restore' | 'purge') {
    await fetch('/api/resources/trash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId, action }),
    });
    await loadTrashed();
    await refreshWorkspace();
  }

  return (
    <div data-testid="bin-page" className="max-w-5xl mx-auto p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white border border-[#E6E6E3] flex items-center justify-center">
          <Trash2 className="w-4 h-4 text-[#191918]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#191918]">Trash</h1>
          <p className="text-xs text-[#6B6B68]">Restore soft-deleted resources or purge them permanently</p>
        </div>
      </div>

      {trashed.length === 0 ? (
        <div className="p-12 rounded-2xl border border-dashed border-[#E6E6E3] text-center text-sm text-[#6B6B68]">
          Your Trash is empty.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E6E6E3] divide-y divide-[#E6E6E3]">
          {trashed.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-medium text-[#191918]">{item.name}</div>
                <div className="text-[11px] text-[#6B6B68] uppercase">{item.kind}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  data-testid={`restore-resource-${item.id}`}
                  type="button"
                  onClick={() => handleTrashAction(item.id, 'restore')}
                  className="px-3 py-1.5 rounded-xl bg-[#F3F3F1] hover:bg-[#E6E6E3] text-xs font-medium flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                </button>
                <button
                  data-testid={`purge-resource-${item.id}`}
                  type="button"
                  onClick={() => handleTrashAction(item.id, 'purge')}
                  className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium"
                >
                  Delete permanently
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
