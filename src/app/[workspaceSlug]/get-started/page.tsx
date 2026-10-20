'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, FolderKanban, Sparkles, Plus, Plug, ArrowRight } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

const CHECKLIST_ITEMS = [
  { id: 'explore', title: 'Explore your Example space', desc: 'Open notes, PDFs, videos, voice memos, and spatial canvases.' },
  { id: 'note', title: 'Write a smart note with / slash commands', desc: 'Type / inside any note to trigger Rue AI writing or formatting.' },
  { id: 'rue', title: 'Ask Rue AI Assistant a question', desc: 'Synthesize insights across all resources using Copilot SDK or Azure OpenAI.' },
  { id: 'connect', title: 'Connect an external integration', desc: 'Link Google Drive, Notion, Slack, GitHub, or Gmail.' },
  { id: 'agent', title: 'Schedule an autonomous AI Agent', desc: 'Run daily or weekly research digests automatically in Tasks.' },
];

export default function GetStartedPage() {
  const { workspaceSlug, spaces, createQuickResource, setAssistantOpen } = useWorkspace();
  const [completed, setCompleted] = useState<string[]>(['explore']);

  const exampleSpace = spaces.find((s) => s.name === 'Example space') || spaces[0];

  function toggleItem(id: string) {
    setCompleted((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div data-testid="get-started-page" className="max-w-5xl mx-auto p-6 sm:p-10 space-y-8">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#45BAF9]/15 text-[#0284C7] text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> Welcome to Fabric
        </span>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#191918]">
          Get started with your self-organizing workspace
        </h1>
        <p className="text-sm text-[#6B6B68] max-w-2xl">
          Capture notes, documents, bookmarks, voice recordings, and canvases in one place—powered by Rue AI.
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          data-testid="get-started-example-space-card"
          href={exampleSpace ? `/${workspaceSlug}/spaces/${exampleSpace.id}` : `/${workspaceSlug}/spaces`}
          className="p-5 rounded-2xl bg-white border border-[#E6E6E3] hover:border-[#191918]/40 transition space-y-3"
        >
          <FolderKanban className="w-6 h-6 text-amber-500" />
          <div>
            <h3 className="font-semibold text-sm text-[#191918]">Open Example space</h3>
            <p className="text-xs text-[#6B6B68] mt-1">
              Explore 9 curated multimodal items including PDFs, videos, audio, and canvases.
            </p>
          </div>
          <div className="text-xs font-semibold text-[#191918] flex items-center gap-1">
            Explore space <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        <button
          data-testid="get-started-new-note-card"
          type="button"
          onClick={() =>
            createQuickResource({
              kind: 'notepad',
              name: 'My First Fabric Note',
              openAfterCreate: true,
            })
          }
          className="p-5 rounded-2xl bg-white border border-[#E6E6E3] hover:border-[#191918]/40 transition space-y-3 text-left"
        >
          <Plus className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-sm text-[#191918]">Create a rich note</h3>
            <p className="text-xs text-[#6B6B68] mt-1">
              Start writing with live Markdown and `/ai` slash commands.
            </p>
          </div>
          <div className="text-xs font-semibold text-[#191918] flex items-center gap-1">
            New note <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        <button
          data-testid="get-started-ask-rue-card"
          type="button"
          onClick={() => setAssistantOpen(true)}
          className="p-5 rounded-2xl bg-white border border-[#E6E6E3] hover:border-[#191918]/40 transition space-y-3 text-left"
        >
          <Sparkles className="w-6 h-6 text-[#45BAF9]" />
          <div>
            <h3 className="font-semibold text-sm text-[#191918]">Chat with Rue AI</h3>
            <p className="text-xs text-[#6B6B68] mt-1">
              Switch between GitHub Copilot SDK and Azure OpenAI at any time.
            </p>
          </div>
          <div className="text-xs font-semibold text-[#0284C7] flex items-center gap-1">
            Open Assistant <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Interactive Onboarding Checklist */}
      <div className="bg-white rounded-2xl border border-[#E6E6E3] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#191918]">Onboarding checklist</h2>
            <p className="text-xs text-[#6B6B68]">
              {completed.length} of {CHECKLIST_ITEMS.length} completed
            </p>
          </div>
          <Link
            href={`/${workspaceSlug}/connections`}
            className="px-3 py-1.5 rounded-xl border border-[#E6E6E3] text-xs font-medium flex items-center gap-1.5 hover:bg-[#F8F8F7]"
          >
            <Plug className="w-3.5 h-3.5" /> Connect apps
          </Link>
        </div>

        <div className="divide-y divide-[#E6E6E3]">
          {CHECKLIST_ITEMS.map((item) => {
            const done = completed.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="py-3.5 flex items-start gap-3 cursor-pointer"
              >
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-[#9B9B97] shrink-0 mt-0.5" />
                )}
                <div>
                  <div className={`text-sm font-medium ${done ? 'line-through text-[#9B9B97]' : 'text-[#191918]'}`}>
                    {item.title}
                  </div>
                  <div className="text-xs text-[#6B6B68]">{item.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
