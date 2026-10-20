'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  Share2,
  MessageSquare,
  Info,
  Sparkles,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Send,
  Check,
  MapPin,
  Clock,
  Tag as TagIcon,
  ExternalLink,
  Trash2,
  Wand2,
} from 'lucide-react';
import { CommentItem, ResourceItem, useWorkspace } from './WorkspaceContext';
import { FABRIC_AI_MODELS } from '@/lib/ai/types';

interface CanvasNode {
  id: string;
  type: 'sticky' | 'text' | 'resource';
  title: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  resourceId?: string;
}

interface CanvasEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

const SLASH_COMMANDS = [
  { id: 'ai-ask', group: 'AI', label: 'Ask AI', desc: 'Generate insights with Rue AI', insert: '\n> **Rue AI Synthesis:** Key architectural takeaway generated inline.\n' },
  { id: 'ai-summary', group: 'AI', label: 'Summarize', desc: 'Insert executive summary block', insert: '\n### Executive Summary\n- Core thesis and key findings synthesized automatically.\n' },
  { id: 'ai-continue', group: 'AI', label: 'Continue writing', desc: 'Expand the current thought', insert: '\nFurthermore, linking spatial canvases with timestamped media annotations enables fast associative recall.\n' },
  { id: 'h1', group: 'Format', label: 'Heading 1', desc: 'Large section heading', insert: '\n# Section Heading\n' },
  { id: 'h2', group: 'Format', label: 'Heading 2', desc: 'Medium section heading', insert: '\n## Subheading\n' },
  { id: 'h3', group: 'Format', label: 'Heading 3', desc: 'Small section heading', insert: '\n### Topic Header\n' },
  { id: 'bullet', group: 'Format', label: 'Bullet list', desc: 'Unordered bullet points', insert: '\n- First point\n- Second point\n' },
  { id: 'numbered', group: 'Format', label: 'Numbered list', desc: 'Ordered steps', insert: '\n1. First step\n2. Second step\n' },
  { id: 'todo', group: 'Format', label: 'To-do list', desc: 'Actionable checklist', insert: '\n- [ ] Action item 1\n- [ ] Action item 2\n' },
  { id: 'quote', group: 'Format', label: 'Quote', desc: 'Blockquote callout', insert: '\n> "The human mind operates by association."\n' },
  { id: 'callout', group: 'Format', label: 'Callout', desc: 'Highlighted note box', insert: '\n> 💡 **Note:** Important observation recorded here.\n' },
  { id: 'code', group: 'Format', label: 'Code block', desc: 'Fenced code snippet', insert: '\n```ts\nconst provider = getAIProvider("copilot-sdk");\n```\n' },
  { id: 'divider', group: 'Format', label: 'Divider', desc: 'Horizontal rule', insert: '\n---\n' },
  { id: 'table', group: 'Format', label: 'Table', desc: 'Markdown comparison table', insert: '\n| Feature | Provider | Status |\n|---|---|---|\n| Rue AI | Copilot SDK | Active |\n' },
];

function formatSeconds(sec?: number | null): string {
  if (sec === undefined || sec === null || Number.isNaN(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ExpandedResourceModal() {
  const {
    expandedResourceId,
    closeExpandedResource,
    workspace,
    tags: allTags,
    aiActions,
    refreshWorkspace,
  } = useWorkspace();

  const [resource, setResource] = useState<ResourceItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [rightTab, setRightTab] = useState<'ai' | 'comments' | 'info'>('ai');
  const [shareOpen, setShareOpen] = useState(false);

  // Editor state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [slashMenuOpen, setSlashMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Canvas state
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([]);
  const [canvasEdges, setCanvasEdges] = useState<CanvasEdge[]>([]);
  const [canvasZoom, setCanvasZoom] = useState(100);

  // Media / Viewer state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [loopAudio, setLoopAudio] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);
  const [viewerZoom, setViewerZoom] = useState(100);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);

  // Comments state
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newCommentText, setNewCommentText] = useState('');

  // AI Chat state for current file
  const [aiMessages, setAiMessages] = useState<Array<{ role: string; content: string; model?: string; provider?: string }>>([]);
  const [aiInput, setAiInput] = useState('');
  const [selectedModel, setSelectedModel] = useState('auto');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [actionsDropdownOpen, setActionsDropdownOpen] = useState(false);
  const [aiSending, setAiSending] = useState(false);

  useEffect(() => {
    if (!expandedResourceId) {
      setResource(null);
      return;
    }
    setLoading(true);
    fetch(`/api/resources/${expandedResourceId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.resource) {
          const r: ResourceItem = data.resource;
          setResource(r);
          setTitle(r.name);
          setDescription(r.description || '');
          setContent(r.content || '');
          setComments(r.comments || []);
          setPendingPin(null);
          setPdfPage(1);
          setViewerZoom(100);

          if (r.kind === 'audio' || r.kind === 'voice_note' || r.kind === 'video') {
            setRightTab('comments');
          } else {
            setRightTab('ai');
          }

          if (r.kind === 'canvas' && r.data) {
            try {
              const parsed = JSON.parse(r.data);
              setCanvasNodes(parsed.nodes || []);
              setCanvasEdges(parsed.edges || []);
            } catch {
              setCanvasNodes([]);
            }
          }

          setAiMessages([
            {
              role: 'assistant',
              content: `I'm grounded in **${r.name}** (${r.kind}). Ask me anything about this file or choose one of the **Actions** below.`,
            },
          ]);
        }
      })
      .finally(() => setLoading(false));
  }, [expandedResourceId]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && expandedResourceId) {
        if (slashMenuOpen) {
          setSlashMenuOpen(false);
        } else {
          closeExpandedResource();
        }
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [expandedResourceId, slashMenuOpen, closeExpandedResource]);

  if (!expandedResourceId) return null;

  async function handleSaveResource(overrides?: Record<string, unknown>) {
    if (!resource) return;
    setSaving(true);
    try {
      const payload = {
        name: title,
        description,
        content,
        ...(resource.kind === 'canvas'
          ? { data: { zoom: canvasZoom / 100, nodes: canvasNodes, edges: canvasEdges } }
          : {}),
        ...overrides,
      };
      const res = await fetch(`/api/resources/${resource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setResource(data.resource);
        await refreshWorkspace();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleTag(tagId: string) {
    if (!resource) return;
    const currentTagIds = (resource.tags || []).map((t) => t.tagId);
    const nextTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];
    await handleSaveResource({ tagIds: nextTagIds });
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!resource || !newCommentText.trim()) return;

    const payload: Record<string, unknown> = {
      resourceId: resource.id,
      text: newCommentText.trim(),
    };

    if (resource.kind === 'audio' || resource.kind === 'voice_note' || resource.kind === 'video') {
      payload.timestamp = currentTime;
    }
    if (resource.kind === 'document') {
      payload.page = pdfPage;
    }
    if (pendingPin) {
      payload.pinX = pendingPin.x;
      payload.pinY = pendingPin.y;
    }

    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setNewCommentText('');
      setPendingPin(null);
      await refreshWorkspace();
    }
  }

  async function handleSendAi(promptToSend: string, actionName?: string) {
    if (!resource || !workspace) return;
    const text = promptToSend.trim();
    if (!text && !actionName) return;

    setAiSending(true);
    setAiMessages((prev) => [
      ...prev,
      { role: 'user', content: actionName ? `Action: ${actionName}` : text },
    ]);
    setAiInput('');
    setActionsDropdownOpen(false);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace.id,
          resourceId: resource.id,
          prompt: text,
          actionName,
          model: selectedModel,
        }),
      });
      const data = await res.json();
      if (data.completion) {
        setAiMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.completion.content,
            model: data.completion.model,
            provider: data.completion.provider,
          },
        ]);
      }
    } finally {
      setAiSending(false);
    }
  }

  function handleSpatialClick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setPendingPin({ x, y });
    setRightTab('comments');
  }

  function addCanvasNode(type: 'sticky' | 'text') {
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      type,
      title: type === 'sticky' ? 'Sticky Note' : 'Architecture Block',
      content: 'Click to edit spatial card content...',
      x: 100 + (canvasNodes.length * 45) % 300,
      y: 100 + (canvasNodes.length * 35) % 220,
      width: 240,
      height: 140,
      color: type === 'sticky' ? '#FEF3C7' : '#DBEAFE',
    };
    setCanvasNodes((prev) => [...prev, newNode]);
  }

  return (
    <div
      data-testid="expanded-resource-modal"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4"
    >
      <div className="bg-white w-full h-full max-w-[1400px] max-h-[92vh] rounded-2xl border border-[#E6E6E3] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Toolbar */}
        <div className="h-14 px-4 border-b border-[#E6E6E3] flex items-center justify-between gap-4 bg-[#F8F8F7] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              data-testid="close-expanded-resource"
              type="button"
              onClick={closeExpandedResource}
              className="px-2.5 py-1.5 rounded-lg border border-[#E6E6E3] bg-white hover:bg-[#F3F3F1] text-xs font-medium flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Collapse (Esc)</span>
            </button>
            <span className="text-xs text-[#6B6B68] truncate">
              {resource?.parent?.name || 'Workspace'} / <strong className="text-[#191918]">{title}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              data-testid="save-resource-btn"
              type="button"
              onClick={() => handleSaveResource()}
              className="px-3 py-1.5 rounded-lg bg-[#191918] text-white text-xs font-medium hover:bg-[#2c2c2a]"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>

            {/* Share button & popover */}
            <div className="relative">
              <button
                data-testid="viewer-share-btn"
                type="button"
                onClick={() => setShareOpen((v) => !v)}
                className={`p-2 rounded-lg border ${
                  resource?.isShared
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-[#E6E6E3] bg-white text-[#191918]'
                }`}
                title="Share resource"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {shareOpen && resource && (
                <div
                  data-testid="viewer-share-popover"
                  className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#E6E6E3] shadow-xl p-4 z-40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">Share & Publish</span>
                    <input
                      data-testid="toggle-share-checkbox"
                      type="checkbox"
                      checked={resource.isShared}
                      onChange={(e) => handleSaveResource({ isShared: e.target.checked })}
                    />
                  </div>
                  <p className="text-[11px] text-[#6B6B68]">
                    Enable public link sharing with viewer or editor permissions.
                  </p>
                  <label className="flex items-center justify-between text-xs">
                    <span>Password protect</span>
                    <input
                      type="checkbox"
                      checked={resource.isPasswordProtected}
                      onChange={(e) => handleSaveResource({ isPasswordProtected: e.target.checked })}
                    />
                  </label>
                  {resource.isShared && (
                    <div className="p-2 rounded-lg bg-[#F8F8F7] border border-[#E6E6E3] text-[11px] font-mono break-all">
                      https://fabric.local/share/{resource.shareToken || resource.id}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Inspector Tab Switchers */}
            <div className="flex items-center bg-[#E6E6E3]/60 p-0.5 rounded-xl">
              <button
                data-testid="viewer-tab-ai"
                type="button"
                onClick={() => setRightTab('ai')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                  rightTab === 'ai' ? 'bg-white shadow-2xs text-[#191918]' : 'text-[#6B6B68]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#45BAF9]" />
                <span>Rue</span>
              </button>
              <button
                data-testid="viewer-tab-comments"
                type="button"
                onClick={() => setRightTab('comments')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                  rightTab === 'comments' ? 'bg-white shadow-2xs text-[#191918]' : 'text-[#6B6B68]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{comments.length}</span>
              </button>
              <button
                data-testid="viewer-tab-info"
                type="button"
                onClick={() => setRightTab('info')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${
                  rightTab === 'info' ? 'bg-white shadow-2xs text-[#191918]' : 'text-[#6B6B68]'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Split Body */}
        {loading || !resource ? (
          <div className="flex-1 flex items-center justify-center text-sm text-[#6B6B68]">
            Loading resource...
          </div>
        ) : (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Left Primary Viewer / Editor */}
            <div className="flex-1 overflow-y-auto bg-white flex flex-col">
              {/* 1. RICH NOTE EDITOR */}
              {resource.kind === 'notepad' && (
                <div data-testid="notepad-editor" className="flex-1 flex flex-col">
                  {resource.cover && (
                    <div className="h-44 w-full overflow-hidden relative">
                      <img src={resource.cover} alt={title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="max-w-3xl w-full mx-auto px-8 py-8 flex-1 flex flex-col">
                    <input
                      data-testid="note-title-input"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Untitled note"
                      className="text-3xl font-bold text-[#191918] bg-transparent focus:outline-none mb-3"
                    />

                    {/* Metadata & Tags Row */}
                    <div className="flex flex-wrap items-center gap-3 pb-4 mb-5 border-b border-[#E6E6E3] text-xs text-[#6B6B68]">
                      <span>Last modified {new Date(resource.modifiedAt).toLocaleTimeString()}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <TagIcon className="w-3.5 h-3.5" />
                        {allTags.map((tag) => {
                          const active = resource.tags?.some((rt) => rt.tagId === tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => handleToggleTag(tag.id)}
                              className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition ${
                                active
                                  ? 'bg-[#191918] text-white border-[#191918]'
                                  : 'bg-[#F8F8F7] text-[#6B6B68] border-[#E6E6E3]'
                              }`}
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Slash Command Trigger Bar */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-[#9B9B97]">
                        Write Markdown or type <kbd className="px-1.5 py-0.5 bg-[#F3F3F1] rounded">/</kbd> for AI & formatting commands
                      </span>
                      <button
                        data-testid="open-slash-menu-btn"
                        type="button"
                        onClick={() => setSlashMenuOpen((v) => !v)}
                        className="px-2.5 py-1 rounded-lg bg-[#F3F3F1] hover:bg-[#E6E6E3] text-xs font-medium flex items-center gap-1"
                      >
                        <Wand2 className="w-3 h-3 text-[#45BAF9]" />
                        <span>/ Commands</span>
                      </button>
                    </div>

                    {slashMenuOpen && (
                      <div
                        data-testid="slash-command-menu"
                        className="mb-3 rounded-2xl border border-[#E6E6E3] bg-white shadow-xl p-2 max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1 z-20"
                      >
                        {SLASH_COMMANDS.map((cmd) => (
                          <button
                            key={cmd.id}
                            data-testid={`slash-cmd-${cmd.id}`}
                            type="button"
                            onClick={() => {
                              setContent((prev) => prev + cmd.insert);
                              setSlashMenuOpen(false);
                            }}
                            className="p-2 rounded-xl hover:bg-[#F8F8F7] text-left flex items-start justify-between"
                          >
                            <div>
                              <div className="text-xs font-semibold text-[#191918]">{cmd.label}</div>
                              <div className="text-[11px] text-[#6B6B68]">{cmd.desc}</div>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F3F3F1] text-[#6B6B68]">
                              {cmd.group}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    <textarea
                      data-testid="note-content-textarea"
                      value={content}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContent(val);
                        if (val.endsWith('/')) {
                          setSlashMenuOpen(true);
                        }
                      }}
                      placeholder="Write, or press '/' for commands..."
                      className="flex-1 w-full min-h-[360px] resize-none text-sm leading-relaxed text-[#191918] bg-transparent focus:outline-none font-sans"
                    />
                  </div>
                </div>
              )}

              {/* 2. SPATIAL CANVAS EDITOR */}
              {resource.kind === 'canvas' && (
                <div data-testid="canvas-editor" className="flex-1 flex flex-col relative bg-[#F3F3F1]">
                  <div className="p-4 bg-white border-b border-[#E6E6E3] flex items-center justify-between">
                    <input
                      data-testid="canvas-title-input"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-lg font-semibold bg-transparent focus:outline-none"
                    />
                    <span className="text-xs text-[#6B6B68]">{canvasNodes.length} spatial cards</span>
                  </div>

                  <div
                    className="flex-1 relative overflow-auto p-8"
                    style={{
                      backgroundImage: 'radial-gradient(#CBD5E1 1px, transparent 1px)',
                      backgroundSize: '20px 20px',
                    }}
                  >
                    <div
                      className="relative min-w-[900px] min-h-[550px] origin-top-left transition-transform"
                      style={{ transform: `scale(${canvasZoom / 100})` }}
                    >
                      {canvasNodes.map((node, idx) => (
                        <div
                          key={node.id}
                          data-testid={`canvas-node-${idx}`}
                          style={{
                            left: node.x,
                            top: node.y,
                            width: node.width,
                            minHeight: node.height,
                            backgroundColor: node.color || '#FEF3C7',
                          }}
                          className="absolute rounded-2xl border border-black/10 shadow-md p-4 flex flex-col justify-between"
                        >
                          <input
                            type="text"
                            value={node.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCanvasNodes((prev) =>
                                prev.map((n) => (n.id === node.id ? { ...n, title: val } : n))
                              );
                            }}
                            className="font-semibold text-xs bg-transparent focus:outline-none mb-1.5 text-[#191918]"
                          />
                          <textarea
                            value={node.content}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCanvasNodes((prev) =>
                                prev.map((n) => (n.id === node.id ? { ...n, content: val } : n))
                              );
                            }}
                            className="text-xs bg-transparent resize-none focus:outline-none text-[#191918]/90 flex-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Floating Canvas Toolbar */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#191918] text-white rounded-2xl shadow-xl px-4 py-2 flex items-center gap-3">
                    <button
                      data-testid="canvas-add-sticky"
                      type="button"
                      onClick={() => addCanvasNode('sticky')}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Sticky Note</span>
                    </button>
                    <button
                      data-testid="canvas-add-text"
                      type="button"
                      onClick={() => addCanvasNode('text')}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Text Block</span>
                    </button>
                    <div className="h-4 w-px bg-white/20" />
                    <button
                      type="button"
                      onClick={() => setCanvasZoom((z) => Math.max(50, z - 10))}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono">{canvasZoom}%</span>
                    <button
                      type="button"
                      onClick={() => setCanvasZoom((z) => Math.min(150, z + 10))}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* 3. AUDIO & VOICE NOTE WAVEFORM PLAYER */}
              {(resource.kind === 'audio' || resource.kind === 'voice_note') && (
                <div data-testid="audio-waveform-viewer" className="flex-1 flex flex-col justify-between p-8 bg-[#F8F8F7]">
                  <div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                      {resource.kind === 'voice_note' ? 'VOICE NOTE' : 'AUDIO TRACK'}
                    </span>
                    <h2 className="text-2xl font-bold mt-2">{title}</h2>
                    <p className="text-xs text-[#6B6B68] mt-1">{description}</p>
                  </div>

                  {/* Interactive Waveform with Timestamped Comment Pins */}
                  <div className="my-8 bg-white rounded-2xl border border-[#E6E6E3] p-6 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-[#6B6B68] mb-3 font-mono">
                      <span data-testid="audio-current-time">{formatSeconds(currentTime)}</span>
                      <span>02:24</span>
                    </div>

                    <div
                      data-testid="waveform-bars"
                      className="h-28 flex items-end gap-1.5 cursor-pointer relative px-2"
                    >
                      {[28, 45, 72, 54, 88, 95, 60, 42, 76, 90, 64, 38, 52, 80, 96, 70, 48, 62, 84, 56, 40, 74, 88, 63, 46, 68, 91, 55, 36, 62, 78, 50].map(
                        (peak, idx) => {
                          const barSecond = Math.round((idx / 32) * 144);
                          const active = barSecond <= currentTime;
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                setCurrentTime(barSecond);
                                setRightTab('comments');
                              }}
                              className={`flex-1 rounded-full transition-all ${
                                active ? 'bg-[#191918]' : 'bg-[#45BAF9]/60 hover:bg-[#45BAF9]'
                              }`}
                              style={{ height: `${peak}%` }}
                              title={`Jump to ${formatSeconds(barSecond)}`}
                            />
                          );
                        }
                      )}
                    </div>

                    {/* Controls */}
                    <div className="mt-6 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          setPlaybackSpeed((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1))
                        }
                        className="px-2.5 py-1 rounded-lg border border-[#E6E6E3] text-xs font-mono font-semibold"
                      >
                        {playbackSpeed}x
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrentTime((t) => Math.max(0, t - 10))}
                          className="p-2 rounded-full hover:bg-[#F3F3F1]"
                          title="-10s"
                        >
                          <SkipBack className="w-4 h-4" />
                        </button>
                        <button
                          data-testid="audio-play-toggle"
                          type="button"
                          onClick={() => {
                            setIsPlaying((p) => !p);
                            if (!isPlaying && currentTime === 0) setCurrentTime(15);
                          }}
                          className="w-11 h-11 rounded-full bg-[#191918] text-white flex items-center justify-center shadow"
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentTime((t) => Math.min(144, t + 10))}
                          className="p-2 rounded-full hover:bg-[#F3F3F1]"
                          title="+10s"
                        >
                          <SkipForward className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setLoopAudio((l) => !l)}
                        className={`p-2 rounded-lg border ${
                          loopAudio ? 'border-[#191918] bg-[#F3F3F1]' : 'border-transparent text-[#6B6B68]'
                        }`}
                      >
                        <Repeat className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Transcript Section */}
                  <div className="bg-white rounded-2xl border border-[#E6E6E3] p-4">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#6B6B68] mb-2">
                      Transcript & Field Notes
                    </div>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={4}
                      className="w-full text-xs text-[#191918] font-mono bg-transparent focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {/* 4. VIDEO VIEWER WITH SPATIAL & TIMESTAMP PINS */}
              {resource.kind === 'video' && (
                <div data-testid="video-viewer" className="flex-1 flex flex-col justify-between p-6 bg-[#111215] text-white">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium truncate">{title}</div>
                    <span className="text-xs text-slate-400">Click video frame to drop spatial pin</span>
                  </div>

                  <div
                    data-testid="video-frame-surface"
                    onClick={handleSpatialClick}
                    className="my-4 relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video max-h-[60vh] mx-auto w-full cursor-crosshair flex items-center justify-center"
                  >
                    {resource.thumbnail && (
                      <img
                        src={resource.thumbnail}
                        alt={title}
                        className="w-full h-full object-cover opacity-85"
                      />
                    )}
                    {/* Existing spatial comment pins */}
                    {comments
                      .filter((c) => typeof c.pinX === 'number' && typeof c.pinY === 'number')
                      .map((c, idx) => (
                        <div
                          key={c.id}
                          style={{ left: `${c.pinX}%`, top: `${c.pinY}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#45BAF9] text-[#191918] font-bold text-xs flex items-center justify-center shadow-lg border-2 border-white"
                          title={c.body}
                        >
                          {idx + 1}
                        </div>
                      ))}
                    {pendingPin && (
                      <div
                        style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-amber-400 text-black font-bold text-xs flex items-center justify-center shadow-lg border-2 border-white animate-bounce"
                      >
                        +
                      </div>
                    )}
                  </div>

                  {/* Video Scrub & Timestamp Bar */}
                  <div className="bg-white/10 rounded-xl p-3 flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlaying((v) => !v);
                        setCurrentTime(3);
                      }}
                      className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                    <div
                      onClick={() => setCurrentTime(5)}
                      className="flex-1 h-2 bg-white/20 rounded-full relative cursor-pointer"
                    >
                      <div className="h-full bg-[#45BAF9] rounded-full" style={{ width: '25%' }} />
                    </div>
                    <span className="text-xs font-mono">{formatSeconds(currentTime)} / 00:15</span>
                  </div>
                </div>
              )}

              {/* 5. MULTI-PAGE PDF DOCUMENT VIEWER WITH SPATIAL PINS */}
              {resource.kind === 'document' && (
                <div data-testid="pdf-viewer" className="flex-1 flex flex-col bg-[#E6E6E3]/50">
                  <div className="h-11 px-4 bg-white border-b border-[#E6E6E3] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        data-testid="pdf-prev-page"
                        type="button"
                        onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                        className="p-1 rounded hover:bg-[#F3F3F1]"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span data-testid="pdf-page-indicator" className="font-medium">
                        Page {pdfPage} of 11
                      </span>
                      <button
                        data-testid="pdf-next-page"
                        type="button"
                        onClick={() => setPdfPage((p) => Math.min(11, p + 1))}
                        className="p-1 rounded hover:bg-[#F3F3F1]"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewerZoom((z) => Math.max(60, z - 15))}
                        className="p-1 rounded hover:bg-[#F3F3F1]"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="font-mono">{viewerZoom}%</span>
                      <button
                        type="button"
                        onClick={() => setViewerZoom((z) => Math.min(160, z + 15))}
                        className="p-1 rounded hover:bg-[#F3F3F1]"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto p-6 flex justify-center">
                    <div
                      data-testid="pdf-page-surface"
                      onClick={handleSpatialClick}
                      style={{ width: `${Math.round((680 * viewerZoom) / 100)}px` }}
                      className="bg-white rounded-xl shadow-md border border-[#E6E6E3] p-10 relative cursor-crosshair min-h-[680px]"
                    >
                      <div className="text-xs uppercase tracking-widest text-[#6B6B68] mb-2">
                        NIPS 2017 • Page {pdfPage}
                      </div>
                      <h2 className="text-2xl font-serif font-bold text-[#191918] mb-4">
                        {title}
                      </h2>
                      <p className="text-xs text-[#6B6B68] mb-6 italic">
                        Click anywhere on this page to anchor a numbered spatial comment pin.
                      </p>
                      <div className="prose prose-sm text-sm leading-relaxed text-[#191918] whitespace-pre-line font-serif">
                        {content || description}
                      </div>

                      {comments
                        .filter((c) => (c.page || 1) === pdfPage && typeof c.pinX === 'number')
                        .map((c, idx) => (
                          <div
                            key={c.id}
                            data-testid={`pdf-spatial-pin-${idx + 1}`}
                            style={{ left: `${c.pinX}%`, top: `${c.pinY}%` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shadow-lg border-2 border-white"
                            title={c.body}
                          >
                            {idx + 1}
                          </div>
                        ))}

                      {pendingPin && (
                        <div
                          style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-lg border-2 border-white"
                        >
                          +
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. HIGH-RES IMAGE VIEWER WITH SPATIAL PINS */}
              {resource.kind === 'image' && (
                <div data-testid="image-viewer" className="flex-1 flex flex-col justify-between bg-[#141413] p-6 relative">
                  <div className="flex-1 flex items-center justify-center overflow-auto">
                    <div
                      data-testid="image-pin-surface"
                      onClick={handleSpatialClick}
                      className="relative inline-block cursor-crosshair rounded-xl overflow-hidden shadow-2xl"
                      style={{ transform: `scale(${viewerZoom / 100})` }}
                    >
                      <img
                        src={resource.url || resource.thumbnail || ''}
                        alt={title}
                        className="max-h-[65vh] w-auto object-contain"
                      />
                      {comments
                        .filter((c) => typeof c.pinX === 'number' && typeof c.pinY === 'number')
                        .map((c, idx) => (
                          <div
                            key={c.id}
                            data-testid={`image-spatial-pin-${idx + 1}`}
                            style={{ left: `${c.pinX}%`, top: `${c.pinY}%` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shadow-lg border-2 border-white"
                            title={c.body}
                          >
                            {idx + 1}
                          </div>
                        ))}
                      {pendingPin && (
                        <div
                          style={{ left: `${pendingPin.x}%`, top: `${pendingPin.y}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-xs flex items-center justify-center shadow-lg border-2 border-white"
                        >
                          +
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-3">
                    <div className="bg-black/80 text-white px-4 py-1.5 rounded-xl flex items-center gap-3 text-xs">
                      <button type="button" onClick={() => setViewerZoom(100)} className="hover:text-[#45BAF9]">
                        Fit
                      </button>
                      <button type="button" onClick={() => setViewerZoom((z) => Math.max(50, z - 20))}>
                        -
                      </button>
                      <span className="font-mono">{viewerZoom}%</span>
                      <button type="button" onClick={() => setViewerZoom((z) => Math.min(200, z + 20))}>
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. WEB LINK VIEWER */}
              {resource.kind === 'link' && (
                <div data-testid="link-viewer" className="p-8 max-w-2xl mx-auto w-full space-y-6">
                  <div className="p-6 rounded-2xl border border-[#E6E6E3] bg-[#F8F8F7] space-y-3">
                    <div className="text-xs font-semibold uppercase text-cyan-700">Saved Web Link</div>
                    <h2 className="text-xl font-bold">{title}</h2>
                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-[#2563EB] underline break-all"
                      >
                        <span>{resource.url}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Add notes or highlights about this link..."
                    rows={8}
                    className="w-full p-4 rounded-2xl border border-[#E6E6E3] text-sm"
                  />
                </div>
              )}
            </div>

            {/* Right Contextual Inspector Panel (Rue AI / Comments / Info) */}
            <div className="w-full lg:w-[390px] border-t lg:border-t-0 lg:border-l border-[#E6E6E3] bg-[#F8F8F7] flex flex-col shrink-0">
              {/* TAB 1: RUE AI ASSISTANT SCOPED TO CURRENT FILE */}
              {rightTab === 'ai' && (
                <div data-testid="inspector-ai-panel" className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="p-3 border-b border-[#E6E6E3] bg-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#45BAF9] text-white flex items-center justify-center text-xs font-bold">
                        ☺
                      </div>
                      <span className="text-xs font-semibold">Rue</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#F3F3F1] text-[10px] text-[#6B6B68] truncate max-w-[130px]">
                        Current file
                      </span>
                    </div>

                    {/* Model Selector Dropdown */}
                    <div className="relative">
                      <button
                        data-testid="inspector-model-selector"
                        type="button"
                        onClick={() => setModelDropdownOpen((v) => !v)}
                        className="px-2.5 py-1 rounded-lg border border-[#E6E6E3] text-[11px] font-medium bg-[#F8F8F7]"
                      >
                        {FABRIC_AI_MODELS.find((m) => m.id === selectedModel)?.name || 'Auto'} ▾
                      </button>
                      {modelDropdownOpen && (
                        <div className="absolute right-0 mt-1 w-56 rounded-xl bg-white border border-[#E6E6E3] shadow-xl p-1.5 z-40">
                          {FABRIC_AI_MODELS.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                setSelectedModel(m.id);
                                setModelDropdownOpen(false);
                              }}
                              className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-[#F8F8F7] flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-medium">{m.name}</div>
                                <div className="text-[10px] text-[#6B6B68]">{m.description}</div>
                              </div>
                              {selectedModel === m.id && <Check className="w-3.5 h-3.5" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {aiMessages.map((m, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                          m.role === 'user'
                            ? 'bg-[#191918] text-white ml-6'
                            : 'bg-white border border-[#E6E6E3] text-[#191918] mr-2'
                        }`}
                      >
                        {m.content}
                        {m.provider && (
                          <div className="mt-2 pt-1.5 border-t border-[#E6E6E3] text-[10px] text-[#9B9B97]">
                            Provider: {m.provider} • Model: {m.model}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions & Input */}
                  <div className="p-3 bg-white border-t border-[#E6E6E3] space-y-2 relative">
                    {actionsDropdownOpen && (
                      <div
                        data-testid="inspector-actions-menu"
                        className="absolute bottom-24 left-3 right-3 rounded-2xl bg-white border border-[#E6E6E3] shadow-xl p-2 z-30 max-h-60 overflow-y-auto"
                      >
                        <div className="text-[10px] font-semibold uppercase text-[#6B6B68] px-2 py-1">
                          AI Quick Actions
                        </div>
                        {aiActions.map((act) => (
                          <button
                            key={act.id}
                            data-testid={`inspector-action-${act.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            type="button"
                            onClick={() => handleSendAi(act.prompt, act.name)}
                            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-[#F8F8F7] text-left text-xs font-medium flex items-center justify-between"
                          >
                            <span>{act.name}</span>
                            <Sparkles className="w-3 h-3 text-[#45BAF9]" />
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        data-testid="inspector-actions-btn"
                        type="button"
                        onClick={() => setActionsDropdownOpen((v) => !v)}
                        className="px-2.5 py-1 rounded-lg border border-[#E6E6E3] bg-[#F8F8F7] hover:bg-[#F3F3F1] text-xs font-medium flex items-center gap-1"
                      >
                        <Wand2 className="w-3 h-3 text-[#45BAF9]" />
                        <span>Actions</span>
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendAi(aiInput);
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        data-testid="inspector-ai-input"
                        type="text"
                        value={aiInput}
                        onChange={(e) => setAiInput(e.target.value)}
                        placeholder="Ask or instruct Rue..."
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E6E6E3] bg-[#F8F8F7] focus:bg-white focus:outline-none"
                      />
                      <button
                        data-testid="inspector-ai-send"
                        type="submit"
                        disabled={aiSending}
                        className="p-2 rounded-xl bg-[#191918] text-white disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 2: MULTIMODAL COMMENTS (SPATIAL PINS & TIMESTAMPS) */}
              {rightTab === 'comments' && (
                <div data-testid="inspector-comments-panel" className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="p-3.5 border-b border-[#E6E6E3] bg-white font-semibold text-xs flex items-center justify-between">
                    <span>Comments & Annotations ({comments.length})</span>
                    {(resource.kind === 'audio' || resource.kind === 'voice_note' || resource.kind === 'video') && (
                      <span className="px-2 py-0.5 rounded bg-[#F3F3F1] font-mono text-[11px]">
                        Comment at {formatSeconds(currentTime)}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {comments.length === 0 ? (
                      <div className="text-center py-12 text-xs text-[#6B6B68]">
                        No comments yet. Click on the media or type below to annotate.
                      </div>
                    ) : (
                      comments.map((c, idx) => (
                        <div
                          key={c.id}
                          data-testid={`comment-item-${idx}`}
                          className="p-3 rounded-xl bg-white border border-[#E6E6E3] space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-[#191918]">
                              {c.author?.name || c.author?.email}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {typeof c.timestamp === 'number' && (
                                <button
                                  type="button"
                                  onClick={() => setCurrentTime(c.timestamp || 0)}
                                  className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] flex items-center gap-0.5"
                                >
                                  <Clock className="w-2.5 h-2.5" />
                                  {formatSeconds(c.timestamp)}
                                </button>
                              )}
                              {typeof c.pinX === 'number' && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[10px] flex items-center gap-0.5">
                                  <MapPin className="w-2.5 h-2.5" />#{idx + 1}
                                  {c.page ? ` (p.${c.page})` : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-[#191918]">{c.body}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="p-3 bg-white border-t border-[#E6E6E3] space-y-2">
                    {pendingPin && (
                      <div className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg flex items-center justify-between">
                        <span>
                          Spatial pin at ({pendingPin.x}%, {pendingPin.y}%)
                        </span>
                        <button type="button" onClick={() => setPendingPin(null)} className="text-xs underline">
                          Clear
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        data-testid="comment-input"
                        type="text"
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E6E6E3] bg-[#F8F8F7] focus:bg-white focus:outline-none"
                      />
                      <button
                        data-testid="comment-submit"
                        type="submit"
                        className="p-2 rounded-xl bg-[#191918] text-white"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* TAB 3: RESOURCE INFO & METADATA */}
              {rightTab === 'info' && (
                <div data-testid="inspector-info-panel" className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-[#6B6B68] mb-1">
                      Description
                    </label>
                    <textarea
                      data-testid="info-description-input"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onBlur={() => handleSaveResource()}
                      placeholder="Add a description..."
                      rows={3}
                      className="w-full p-2.5 rounded-xl border border-[#E6E6E3] bg-white"
                    />
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-[#E6E6E3] space-y-2">
                    <div className="font-semibold text-[#191918] mb-1">Details</div>
                    <div className="flex justify-between text-[#6B6B68]">
                      <span>Kind</span>
                      <span className="font-medium text-[#191918] capitalize">{resource.kind}</span>
                    </div>
                    <div className="flex justify-between text-[#6B6B68]">
                      <span>MIME Type</span>
                      <span className="font-mono text-[11px]">{resource.mimeType}</span>
                    </div>
                    <div className="flex justify-between text-[#6B6B68]">
                      <span>Size</span>
                      <span>{Math.max(1, Math.round(resource.size / 1024))} KB</span>
                    </div>
                    <div className="flex justify-between text-[#6B6B68]">
                      <span>Created</span>
                      <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button
                    data-testid="info-move-to-trash"
                    type="button"
                    onClick={async () => {
                      await handleSaveResource({ trashed: true });
                      closeExpandedResource();
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-red-200 bg-red-50 text-red-700 font-medium flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Move to Trash</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
