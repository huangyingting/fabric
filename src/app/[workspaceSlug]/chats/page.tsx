'use client';

import React, { useEffect, useState } from 'react';
import { Sparkles, Send, MessageSquare } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export default function ChatsPage() {
  const {
    workspaceSlug,
    aiActions,
    activeAiProvider,
    setActiveAiProvider,
    activeAiModel,
    setActiveAiModel,
  } = useWorkspace();

  const [threads, setThreads] = useState<
    Array<{
      id: string;
      title: string;
      messages: Array<{ id: string; role: string; content: string; provider?: string }>;
    }>
  >([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [sending, setSending] = useState(false);

  async function loadThreads() {
    const res = await fetch(`/api/ai/chat?workspaceSlug=${encodeURIComponent(workspaceSlug)}`);
    if (res.ok) {
      const data = await res.json();
      setThreads(data.threads || []);
      if (!selectedThreadId && data.threads?.[0]) {
        setSelectedThreadId(data.threads[0].id);
      }
    }
  }

  useEffect(() => {
    loadThreads();
  }, [workspaceSlug]);

  const currentThread = threads.find((t) => t.id === selectedThreadId);

  async function sendChat(text: string) {
    if (!text.trim()) return;
    setSending(true);
    setPrompt('');
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceSlug,
        threadId: selectedThreadId || undefined,
        message: text,
        provider: activeAiProvider,
        model: activeAiModel,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setSelectedThreadId(data.threadId);
      await loadThreads();
    }
    setSending(false);
  }

  return (
    <div data-testid="chats-page" className="max-w-7xl mx-auto p-6 sm:p-8 flex flex-col lg:flex-row gap-6 h-[calc(100vh-4rem)]">
      {/* Left Thread History */}
      <div className="w-full lg:w-72 shrink-0 bg-white rounded-2xl border border-[#E6E6E3] p-4 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#45BAF9]" /> AI Chats
            </h2>
            <button
              type="button"
              onClick={() => setSelectedThreadId(null)}
              className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#191918] text-white"
            >
              + New chat
            </button>
          </div>

          <div className="space-y-1 max-h-96 overflow-y-auto">
            {threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedThreadId(t.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium truncate ${
                  selectedThreadId === t.id ? 'bg-[#F3F3F1] text-[#191918]' : 'text-[#6B6B68] hover:bg-[#F8F8F7]'
                }`}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>

        {/* Pluggable Provider Selector */}
        <div className="pt-3 border-t border-[#E6E6E3] space-y-2">
          <div className="text-[10px] font-semibold uppercase text-[#9B9B97]">Active AI Provider</div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveAiProvider('copilot-sdk')}
              className={`py-1.5 rounded-lg text-[11px] font-medium border ${
                activeAiProvider === 'copilot-sdk'
                  ? 'bg-[#191918] text-white border-[#191918]'
                  : 'bg-[#F8F8F7] border-[#E6E6E3]'
              }`}
            >
              Copilot SDK
            </button>
            <button
              type="button"
              onClick={() => setActiveAiProvider('azure-openai')}
              className={`py-1.5 rounded-lg text-[11px] font-medium border ${
                activeAiProvider === 'azure-openai'
                  ? 'bg-[#191918] text-white border-[#191918]'
                  : 'bg-[#F8F8F7] border-[#E6E6E3]'
              }`}
            >
              Azure OpenAI
            </button>
          </div>
          <select
            value={activeAiModel}
            onChange={(e) => setActiveAiModel(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E6E6E3] bg-[#F8F8F7]"
          >
            <option value="gpt-4.1">Auto (GPT-4.1)</option>
            <option value="claude-sonnet-4">Claude 4 Sonnet</option>
            <option value="o3-mini">OpenAI o3-mini</option>
          </select>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 bg-white rounded-2xl border border-[#E6E6E3] flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!currentThread || currentThread.messages.length === 0 ? (
            <div className="max-w-lg mx-auto py-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#45BAF9]/15 text-[#45BAF9] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold">Ask Rue anything about your workspace</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {aiActions.slice(0, 4).map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => sendChat(act.prompt)}
                    className="px-3 py-1.5 rounded-xl bg-[#F8F8F7] border border-[#E6E6E3] text-xs hover:border-[#191918]"
                  >
                    ✨ {act.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            currentThread.messages.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#191918] text-white ml-12'
                    : 'bg-[#F8F8F7] border border-[#E6E6E3] text-[#191918] mr-12'
                }`}
              >
                {m.content}
              </div>
            ))
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendChat(prompt);
          }}
          className="p-4 border-t border-[#E6E6E3] flex items-center gap-2"
        >
          <input
            data-testid="chats-page-input"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Message Rue AI Assistant..."
            className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
          />
          <button
            data-testid="chats-page-send"
            type="submit"
            disabled={sending}
            className="px-4 py-2.5 rounded-xl bg-[#191918] text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </form>
      </div>
    </div>
  );
}
