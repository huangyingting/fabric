'use client';

import React, { useState } from 'react';
import { Plug, RefreshCw, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export default function ConnectionsPage() {
  const { workspaceSlug, connections, refreshWorkspace } = useWorkspace();
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  async function toggleConnection(provider: string, currentStatus: string) {
    setBusyProvider(provider);
    const action = currentStatus === 'connected' ? 'disconnect' : 'connect';
    await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceSlug, provider, action }),
    });
    await refreshWorkspace();
    setBusyProvider(null);
  }

  return (
    <div data-testid="connections-page" className="max-w-6xl mx-auto p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#E6E6E3] flex items-center justify-center">
            <Plug className="w-4 h-4 text-[#191918]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#191918]">Connections</h1>
            <p className="text-xs text-[#6B6B68]">
              Auto-sync cloud drives, notes, emails, bookmarks, and repositories into Fabric
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {connections.map((conn) => {
          const isConnected = conn.status === 'connected';
          return (
            <div
              key={conn.id}
              data-testid={`connection-card-${conn.provider}`}
              className="p-5 rounded-2xl bg-white border border-[#E6E6E3] flex flex-col justify-between gap-4 shadow-2xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-[#191918]">{conn.displayName}</span>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Connected ({conn.syncedItems})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-[#F3F3F1] text-[#6B6B68] text-[10px] font-medium">
                      Available
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6B6B68]">
                  Continuous background indexing and semantic search across {conn.displayName}.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E6E6E3]/60">
                <button
                  data-testid={`connection-toggle-${conn.provider}`}
                  type="button"
                  disabled={busyProvider === conn.provider}
                  onClick={() => toggleConnection(conn.provider, conn.status)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
                    isConnected
                      ? 'bg-[#F3F3F1] hover:bg-red-50 hover:text-red-600 text-[#191918]'
                      : 'bg-[#191918] hover:bg-[#2c2c2a] text-white'
                  }`}
                >
                  {busyProvider === conn.provider ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : isConnected ? (
                    'Disconnect'
                  ) : (
                    <>
                      <span>Connect</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
