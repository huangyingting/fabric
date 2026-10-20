'use client';

import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export default function NotificationsPage() {
  const { workspaceSlug, notifications, refreshWorkspace } = useWorkspace();

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceSlug }),
    });
    await refreshWorkspace();
  }

  return (
    <div data-testid="notifications-page" className="max-w-4xl mx-auto p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#E6E6E3] flex items-center justify-center">
            <Bell className="w-4 h-4 text-[#191918]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#191918]">Notifications</h1>
            <p className="text-xs text-[#6B6B68]">Workspace alerts, AI agent completions, and mentions</p>
          </div>
        </div>

        <button
          data-testid="mark-all-read-btn"
          type="button"
          onClick={markAllRead}
          className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E6E6E3] text-xs font-medium flex items-center gap-1.5 hover:bg-[#F3F3F1]"
        >
          <CheckCheck className="w-3.5 h-3.5" /> Mark all as read
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E6E6E3] divide-y divide-[#E6E6E3]">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 flex items-start justify-between gap-4 ${
              n.isRead ? 'opacity-70' : 'bg-[#45BAF9]/5'
            }`}
          >
            <div className="space-y-1">
              <div className="text-xs font-semibold text-[#191918] flex items-center gap-2">
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#45BAF9]" />}
                <span>{n.title}</span>
              </div>
              <p className="text-xs text-[#6B6B68]">{n.body}</p>
            </div>
            <span className="text-[10px] text-[#9B9B97]">
              {new Date(n.createdAt).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
