'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Wand2,
  Globe,
  Check,
  Cpu,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { useWorkspace } from './WorkspaceContext';
import { FABRIC_AI_MODELS } from '@/lib/ai/types';

export function RueAssistantDrawer() {
  const {
    assistantOpen,
    setAssistantOpen,
    workspace,
    aiAgents,
    aiActions,
    expandedResourceId,
    openExpandedResource,
    refreshWorkspace,
  } = useWorkspace();

  const defaultAgent = aiAgents[0] || {
    name: 'Rue',
    color: '#45BAF9',
    personality: 'balanced',
    emailAddress: 'rue@ai.fabric.so',
  };

  let currentProvider: 'copilot-sdk' | 'azure-openai' = 'copilot-sdk';
  try {
    if (workspace?.settings) {
      const parsed = JSON.parse(workspace.settings);
      if (parsed.aiProvider === 'azure-openai') currentProvider = 'azure-openai';
    }
  } catch {
    // default copilot-sdk
  }

  const [messages, setMessages] = useState<
    Array<{
      role: 'user' | 'assistant';
      content: string;
      model?: string;
      provider?: string;
      citations?: Array<{ resourceId: string; resourceName: string; kind: string; snippet: string }>;
    }>
  >([
    {
      role: 'assistant',
      content: `Hi! I'm **${defaultAgent.name}**, your Fabric AI assistant. Ask me anything across your Spaces, Notes, PDFs, Canvases, and Connected Apps—or pick one of the **Actions** below.`,
      provider: currentProvider,
      model: 'auto',
    },
  ]);

  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [providerChoice, setProviderChoice] = useState<'copilot-sdk' | 'azure-openai'>(currentProvider);
  const [webSearch, setWebSearch] = useState(false);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [actionSearch, setActionSearch] = useState('');
  const [sending, setSending] = useState(false);

  if (!assistantOpen) return null;

  async function handleSend(textPrompt: string, actionName?: string) {
    if (!workspace) return;
    const cleaned = textPrompt.trim();
    if (!cleaned && !actionName) return;

    setSending(true);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: actionName ? `[${actionName}] ${cleaned}` : cleaned },
    ]);
    setPrompt('');
    setActionsMenuOpen(false);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          resourceId: expandedResourceId || undefined,
          prompt: cleaned,
          actionName,
          model: selectedModel,
          providerOverride: providerChoice,
          webSearch,
        }),
      });
      const data = await res.json();
      if (data.completion) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.completion.content,
            model: data.completion.model,
            provider: data.completion.provider,
            citations: data.completion.citations,
          },
        ]);
        await refreshWorkspace();
      }
    } finally {
      setSending(false);
    }
  }

  async function handleSwitchProvider(nextProvider: 'copilot-sdk' | 'azure-openai') {
    setProviderChoice(nextProvider);
    if (workspace) {
      await fetch('/api/workspaces', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          settings: { aiProvider: nextProvider },
        }),
      });
      await refreshWorkspace();
    }
  }

  const filteredActions = aiActions.filter((a) =>
    a.name.toLowerCase().includes(actionSearch.toLowerCase())
  );

  return (
    <aside
      data-testid="rue-assistant-drawer"
      className="w-full sm:w-[390px] bg-white border-l border-[#E6E6E3] flex flex-col h-screen fixed right-0 top-0 z-40 shadow-2xl"
    >
      {/* Header */}
      <div className="h-14 px-4 border-b border-[#E6E6E3] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-xl text-white flex items-center justify-center font-bold text-sm"
            style={{ backgroundColor: defaultAgent.color || '#45BAF9' }}
          >
            ☺
          </div>
          <div>
            <div className="text-xs font-semibold text-[#191918]">{defaultAgent.name}</div>
            <div className="text-[10px] text-[#6B6B68] capitalize">{defaultAgent.personality} persona</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Model Selector */}
          <div className="relative">
            <button
              data-testid="assistant-model-selector-btn"
              type="button"
              onClick={() => {
                setModelMenuOpen((v) => !v);
                setActionsMenuOpen(false);
              }}
              className="px-2.5 py-1 rounded-lg border border-[#E6E6E3] bg-[#F8F8F7] text-xs font-medium"
            >
              {FABRIC_AI_MODELS.find((m) => m.id === selectedModel)?.name || 'Auto'} ▾
            </button>

            {modelMenuOpen && (
              <div
                data-testid="assistant-model-popover"
                className="absolute right-0 mt-1.5 w-64 rounded-2xl bg-white border border-[#E6E6E3] shadow-xl p-2 z-50 space-y-1"
              >
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-[#6B6B68]">
                  Model Selection
                </div>
                {FABRIC_AI_MODELS.map((m) => (
                  <button
                    key={m.id}
                    data-testid={`model-option-${m.id}`}
                    type="button"
                    onClick={() => {
                      setSelectedModel(m.id);
                      setModelMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl hover:bg-[#F8F8F7] text-left flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium flex items-center gap-1.5">
                        <span>{m.name}</span>
                        <span className="px-1.5 py-0.2 text-[9px] rounded bg-[#F3F3F1] text-[#6B6B68]">
                          {m.badge}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#6B6B68]">{m.description}</div>
                    </div>
                    {selectedModel === m.id && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}

                <div className="border-t border-[#E6E6E3] pt-2 mt-2 px-2">
                  <div className="text-[10px] font-semibold uppercase text-[#6B6B68] mb-1">
                    Pluggable AI Backend
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      data-testid="provider-copilot-sdk"
                      type="button"
                      onClick={() => handleSwitchProvider('copilot-sdk')}
                      className={`py-1 px-2 rounded-lg text-[11px] font-medium border ${
                        providerChoice === 'copilot-sdk'
                          ? 'bg-[#191918] text-white border-[#191918]'
                          : 'border-[#E6E6E3]'
                      }`}
                    >
                      Copilot SDK
                    </button>
                    <button
                      data-testid="provider-azure-openai"
                      type="button"
                      onClick={() => handleSwitchProvider('azure-openai')}
                      className={`py-1 px-2 rounded-lg text-[11px] font-medium border ${
                        providerChoice === 'azure-openai'
                          ? 'bg-[#191918] text-white border-[#191918]'
                          : 'border-[#E6E6E3]'
                      }`}
                    >
                      Azure OpenAI
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            title="New chat"
            onClick={() =>
              setMessages([
                {
                  role: 'assistant',
                  content: `Started a fresh conversation with **${defaultAgent.name}** (\`${providerChoice}\`).`,
                },
              ])
            }
            className="p-1.5 rounded-lg hover:bg-[#F3F3F1] text-[#6B6B68]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            data-testid="close-assistant-drawer"
            type="button"
            onClick={() => setAssistantOpen(false)}
            className="p-1.5 rounded-lg hover:bg-[#F3F3F1] text-[#6B6B68]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pluggable Provider Banner */}
      <div className="px-4 py-1.5 bg-[#F8F8F7] border-b border-[#E6E6E3] flex items-center justify-between text-[11px] text-[#6B6B68]">
        <span className="flex items-center gap-1">
          <Cpu className="w-3 h-3 text-[#45BAF9]" />
          <span>Provider:</span>
          <strong data-testid="active-ai-provider" className="text-[#191918]">
            {providerChoice === 'copilot-sdk' ? '@github/copilot-sdk' : 'Azure OpenAI'}
          </strong>
        </span>
        <span>{expandedResourceId ? 'Scoped: Current file' : 'Scoped: All workspace'}</span>
      </div>

      {/* Chat Messages */}
      <div data-testid="assistant-messages" className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
              m.role === 'user'
                ? 'bg-[#191918] text-white ml-8'
                : 'bg-[#F8F8F7] border border-[#E6E6E3] text-[#191918] mr-2'
            }`}
          >
            <div>{m.content}</div>
            {m.citations && m.citations.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-[#E6E6E3] space-y-1">
                <div className="text-[10px] font-semibold uppercase text-[#6B6B68]">Grounded Sources</div>
                {m.citations.map((cit) => (
                  <button
                    key={cit.resourceId}
                    type="button"
                    onClick={() => openExpandedResource(cit.resourceId)}
                    className="w-full text-left px-2 py-1 rounded-lg bg-white border border-[#E6E6E3] hover:bg-[#F3F3F1] flex items-center gap-1.5 text-[11px]"
                  >
                    <FileText className="w-3 h-3 text-[#45BAF9] shrink-0" />
                    <span className="truncate font-medium">{cit.resourceName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Input + Actions Popover */}
      <div className="p-3 border-t border-[#E6E6E3] bg-white space-y-2 relative">
        {actionsMenuOpen && (
          <div
            data-testid="assistant-actions-popover"
            className="absolute bottom-28 left-3 right-3 rounded-2xl bg-white border border-[#E6E6E3] shadow-2xl p-2.5 z-50 space-y-2 max-h-72 overflow-y-auto"
          >
            <input
              type="text"
              value={actionSearch}
              onChange={(e) => setActionSearch(e.target.value)}
              placeholder="Search actions..."
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-[#E6E6E3] bg-[#F8F8F7]"
            />

            <label className="flex items-center justify-between px-2 py-1 text-xs cursor-pointer">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#45BAF9]" />
                <span>Web search</span>
              </span>
              <input
                type="checkbox"
                checked={webSearch}
                onChange={(e) => setWebSearch(e.target.checked)}
              />
            </label>

            <div className="border-t border-[#E6E6E3] pt-1 space-y-0.5">
              {filteredActions.map((act) => (
                <button
                  key={act.id}
                  data-testid={`assistant-action-${act.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  type="button"
                  onClick={() => handleSend(act.prompt, act.name)}
                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[#F8F8F7] text-left text-xs font-medium flex items-center justify-between"
                >
                  <span>{act.name}</span>
                  <Sparkles className="w-3 h-3 text-[#45BAF9]" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            data-testid="assistant-actions-btn"
            type="button"
            onClick={() => {
              setActionsMenuOpen((v) => !v);
              setModelMenuOpen(false);
            }}
            className="px-2.5 py-1 rounded-lg border border-[#E6E6E3] bg-[#F8F8F7] hover:bg-[#F3F3F1] text-xs font-medium flex items-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5 text-[#45BAF9]" />
            <span>Actions</span>
          </button>
          <span className="text-[10px] text-[#9B9B97]">
            {workspace?.aiCreditsUsed || 45} / {workspace?.aiCreditsLimit || 1000} credits
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(prompt);
          }}
          className="flex items-center gap-2"
        >
          <input
            data-testid="assistant-chat-input"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Ask or instruct ${defaultAgent.name}...`}
            className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-[#E6E6E3] bg-[#F8F8F7] focus:bg-white focus:outline-none"
          />
          <button
            data-testid="assistant-chat-send"
            type="submit"
            disabled={sending}
            className="p-2.5 rounded-xl bg-[#191918] text-white disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  );
}
