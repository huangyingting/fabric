'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Sparkles,
  Home,
  Compass,
  Clock,
  FolderKanban,
  Inbox,
  Plug,
  MessageSquare,
  CalendarClock,
  Tag,
  Users,
  Store,
  Bell,
  Trash2,
  Settings,
  Plus,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  FileText,
  FileCode2,
  Mic,
  Upload,
  Globe,
  FolderPlus,
  LogOut,
  Shield,
} from 'lucide-react';
import { ResourceItem, useWorkspace } from './WorkspaceContext';
import { ExpandedResourceModal } from './ExpandedResourceModal';
import { RueAssistantDrawer } from './RueAssistantDrawer';

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    workspaceSlug,
    workspace,
    spaces,
    notifications,
    currentUser,
    sidebarExpanded,
    setSidebarExpanded,
    mobileNavOpen,
    setMobileNavOpen,
    assistantOpen,
    setAssistantOpen,
    searchModalOpen,
    setSearchModalOpen,
    activeCreateModal,
    setActiveCreateModal,
    createQuickResource,
    openExpandedResource,
  } = useWorkspace();

  const [createMenuOpen, setCreateMenuOpen] = useState(false);

  // Modal form states
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [spaceName, setSpaceName] = useState('');
  const [spaceDesc, setSpaceDesc] = useState('');
  const [voiceTitle, setVoiceTitle] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState(
    '[00:00] Product architecture & sprint planning voice memo.\n[00:12] Action item: finalize Copilot SDK and Azure OpenAI pluggable adapter.'
  );
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadKind, setUploadKind] = useState<'document' | 'image' | 'video' | 'audio'>('document');

  // Search modal state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchKind, setSearchKind] = useState('');
  const [searchResults, setSearchResults] = useState<ResourceItem[]>([]);

  useEffect(() => {
    if (!isRecording) return;
    const t = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isRecording]);

  useEffect(() => {
    if (!searchModalOpen) return;
    const params = new URLSearchParams({ workspaceSlug });
    if (searchQuery.trim()) params.set('search', searchQuery.trim());
    if (searchKind) params.set('kind', searchKind);
    fetch(`/api/resources?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setSearchResults(d.resources || []));
  }, [searchModalOpen, searchQuery, searchKind, workspaceSlug]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navItems = [
    { href: `/${workspaceSlug}/get-started`, label: 'Get started', icon: Compass, testId: 'nav-get-started' },
    { href: `/${workspaceSlug}/home`, label: 'Home', icon: Home, testId: 'nav-home' },
    { href: `/${workspaceSlug}/timeline`, label: 'Timeline', icon: Clock, testId: 'nav-timeline' },
    { href: `/${workspaceSlug}/spaces`, label: 'Spaces', icon: FolderKanban, testId: 'nav-spaces' },
    { href: `/${workspaceSlug}/inbox`, label: 'Inbox', icon: Inbox, testId: 'nav-inbox' },
    { href: `/${workspaceSlug}/connections`, label: 'Connections', icon: Plug, testId: 'nav-connections' },
    { href: `/${workspaceSlug}/chats`, label: 'Chats', icon: MessageSquare, testId: 'nav-chats' },
    { href: `/${workspaceSlug}/tasks`, label: 'Tasks', icon: CalendarClock, testId: 'nav-tasks' },
    { href: `/${workspaceSlug}/tags`, label: 'Tags', icon: Tag, testId: 'nav-tags' },
    { href: `/${workspaceSlug}/shared-with-me`, label: 'Shared with me', icon: Users, testId: 'nav-shared' },
    { href: `/${workspaceSlug}/marketplace`, label: 'Fabric Marketplace', icon: Store, testId: 'nav-marketplace' },
    {
      href: `/${workspaceSlug}/notifications`,
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : undefined,
      testId: 'nav-notifications',
    },
    { href: `/${workspaceSlug}/bin`, label: 'Trash', icon: Trash2, testId: 'nav-bin' },
    { href: `/${workspaceSlug}/settings/account`, label: 'Settings', icon: Settings, testId: 'nav-settings' },
  ];

  async function handleSaveLink(e: React.FormEvent) {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    await createQuickResource({
      kind: 'link',
      name: linkTitle.trim() || linkUrl.replace(/^https?:\/\//, '').slice(0, 48),
      url: linkUrl.trim(),
      description: `Captured web bookmark from ${linkUrl.trim()}`,
      root: 'INBOX',
      openAfterCreate: true,
    });
    setLinkUrl('');
    setLinkTitle('');
    setActiveCreateModal(null);
  }

  async function handleSaveSpace(e: React.FormEvent) {
    e.preventDefault();
    if (!spaceName.trim()) return;
    await createQuickResource({
      kind: 'folder',
      name: spaceName.trim(),
      description: spaceDesc.trim() || 'Custom collaborative workspace folder.',
      root: 'SPACE',
      openAfterCreate: true,
    });
    setSpaceName('');
    setSpaceDesc('');
    setActiveCreateModal(null);
  }

  async function handleSaveVoiceNote(e: React.FormEvent) {
    e.preventDefault();
    await createQuickResource({
      kind: 'voice_note',
      name: voiceTitle.trim() || `Meeting & Voice Note (${new Date().toLocaleTimeString()})`,
      description: `Recorded voice note (${recordingSeconds || 18}s) with automatic AI transcript.`,
      content: voiceTranscript,
      openAfterCreate: true,
    });
    setVoiceTitle('');
    setIsRecording(false);
    setRecordingSeconds(0);
    setActiveCreateModal(null);
  }

  async function handleSaveUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadName.trim()) return;
    await createQuickResource({
      kind: uploadKind,
      name: uploadName.trim(),
      description: `Uploaded ${uploadKind} asset.`,
      content:
        uploadKind === 'document'
          ? `Uploaded Document: ${uploadName.trim()}\n\nIndexed for full-text search and spatial pin annotations.`
          : undefined,
      url:
        uploadKind === 'image'
          ? 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'
          : undefined,
      openAfterCreate: true,
    });
    setUploadName('');
    setActiveCreateModal(null);
  }

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full py-3 px-2.5 select-none">
      <div className="space-y-4 overflow-y-auto">
        {/* Top Workspace Header */}
        <div className="flex items-center justify-between px-2">
          <Link href={`/${workspaceSlug}/home`} className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#191918] text-white flex items-center justify-center font-bold text-xs shrink-0">
              F
            </div>
            {sidebarExpanded && (
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#191918] truncate">
                  Fabric {workspace?.planTier === 'pro' ? 'Pro' : 'Free'}
                </div>
                <div className="text-[10px] text-[#6B6B68] truncate">{workspace?.name || workspaceSlug}</div>
              </div>
            )}
          </Link>

          <div className="flex items-center gap-1">
            {sidebarExpanded && (
              <Link
                href={`/${workspaceSlug}/pricing`}
                className="px-2 py-0.5 rounded-full bg-[#45BAF9]/15 text-[#0284C7] text-[10px] font-semibold"
              >
                Upgrade
              </Link>
            )}
            <button
              data-testid="toggle-sidebar-btn"
              type="button"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="hidden md:flex p-1.5 rounded-lg hover:bg-[#E6E6E3]/60 text-[#6B6B68]"
              title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              {sidebarExpanded ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Create Button */}
        <div className="px-1">
          <button
            data-testid="sidebar-create-btn"
            type="button"
            onClick={() => setCreateMenuOpen((v) => !v)}
            className="w-full py-2 px-3 rounded-xl bg-[#191918] hover:bg-[#2c2c2a] text-white text-xs font-medium flex items-center justify-center gap-2 shadow-2xs transition"
          >
            <Plus className="w-4 h-4" />
            {sidebarExpanded && <span>Create new</span>}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href.includes('/settings/') && pathname.includes('/settings/')) ||
              (item.href.endsWith('/spaces') && pathname.includes('/spaces/'));
            return (
              <Link
                key={item.href}
                data-testid={item.testId}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium transition ${
                  active
                    ? 'bg-white text-[#191918] shadow-2xs border border-[#E6E6E3]/80'
                    : 'text-[#6B6B68] hover:text-[#191918] hover:bg-[#E6E6E3]/40'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className="w-4 h-4 shrink-0" />
                  {sidebarExpanded && <span className="truncate">{item.label}</span>}
                </div>
                {sidebarExpanded && item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#45BAF9] text-white text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Pinned Spaces Tree */}
        {sidebarExpanded && spaces.length > 0 && (
          <div className="pt-2 border-t border-[#E6E6E3] px-2 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#9B9B97] mb-1">
              <span>Spaces</span>
              <button
                type="button"
                onClick={() => setActiveCreateModal('space')}
                className="hover:text-[#191918]"
              >
                +
              </button>
            </div>
            {spaces
              .filter((s) => s.root === 'SPACE')
              .map((sp) => (
                <Link
                  key={sp.id}
                  href={`/${workspaceSlug}/spaces/${sp.id}`}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-[#6B6B68] hover:text-[#191918] hover:bg-[#E6E6E3]/40"
                >
                  <span className="truncate">📁 {sp.name}</span>
                  <span className="text-[10px] text-[#9B9B97]">{sp._count?.children ?? 0}</span>
                </Link>
              ))}
          </div>
        )}
      </div>

      {/* Bottom User Profile & Role Badge */}
      <div className="pt-3 border-t border-[#E6E6E3] px-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-[#191918] text-white text-xs font-semibold flex items-center justify-center shrink-0">
            {(currentUser?.name || currentUser?.email || 'U')[0].toUpperCase()}
          </div>
          {sidebarExpanded && (
            <div className="min-w-0">
              <div className="text-xs font-medium text-[#191918] truncate flex items-center gap-1">
                <span className="truncate">{currentUser?.name || 'User'}</span>
                <span
                  data-testid="user-role-badge"
                  className="px-1.5 py-0.2 rounded bg-[#E6E6E3] text-[9px] font-semibold uppercase"
                >
                  {currentUser?.role || 'Editor'}
                </span>
              </div>
              <div className="text-[10px] text-[#6B6B68] truncate">{currentUser?.email}</div>
            </div>
          )}
        </div>

        {sidebarExpanded && (
          <div className="flex items-center gap-1">
            {currentUser?.role === 'Admin' && (
              <Link
                data-testid="nav-admin-governance"
                href={`/${workspaceSlug}/settings/invitations`}
                title="Admin Invitations & Audit Logs"
                className="p-1.5 rounded-lg hover:bg-[#E6E6E3]/60 text-[#6B6B68]"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-700" />
              </Link>
            )}
            <button
              data-testid="signout-button"
              type="button"
              onClick={() => signOut({ callbackUrl: '/signin' })}
              title="Sign out"
              className="p-1.5 rounded-lg hover:bg-[#E6E6E3]/60 text-[#6B6B68]"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F8F8F7] text-[#191918]">
      {/* Desktop Collapsible Left Sidebar */}
      <aside
        data-testid="workspace-sidebar"
        className={`hidden md:block shrink-0 bg-[#F3F3F1] border-r border-[#E6E6E3] transition-all duration-200 ${
          sidebarExpanded ? 'w-60' : 'w-16'
        }`}
      >
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="w-64 bg-[#F3F3F1] h-full shadow-2xl border-r border-[#E6E6E3]">
            {sidebarContent}
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileNavOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${assistantOpen ? 'sm:mr-[390px]' : ''}`}>
        {/* Mobile Header */}
        <header className="md:hidden h-13 px-4 border-b border-[#E6E6E3] bg-white flex items-center justify-between">
          <button
            data-testid="mobile-menu-button"
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="p-1.5 rounded-lg border border-[#E6E6E3]"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="font-semibold text-sm">{workspace?.name || 'Fabric'}</span>
          <button
            type="button"
            onClick={() => setAssistantOpen(!assistantOpen)}
            className="px-2.5 py-1 rounded-lg bg-[#45BAF9] text-white text-xs font-semibold"
          >
            Rue
          </button>
        </header>

        <main className="flex-1 pb-24">{children}</main>
      </div>

      {/* Floating Bottom Action Bar (+ Create, Search, Rue Assistant) */}
      <div
        data-testid="floating-action-bar"
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-white/95 backdrop-blur-md border border-[#E6E6E3] shadow-xl rounded-2xl px-3 py-2"
      >
        <div className="relative">
          <button
            data-testid="bottom-create-btn"
            type="button"
            onClick={() => setCreateMenuOpen((v) => !v)}
            className="w-9 h-9 rounded-xl bg-[#191918] hover:bg-[#2c2c2a] text-white flex items-center justify-center shadow-xs transition"
            title="Create new"
          >
            <Plus className="w-4 h-4" />
          </button>

          {createMenuOpen && (
            <div
              data-testid="create-menu-popover"
              className="absolute bottom-12 left-0 w-56 rounded-2xl bg-white border border-[#E6E6E3] shadow-2xl p-1.5 z-50 space-y-0.5"
            >
              <button
                data-testid="create-option-note"
                type="button"
                onClick={async () => {
                  setCreateMenuOpen(false);
                  await createQuickResource({
                    kind: 'notepad',
                    name: 'Untitled note',
                    openAfterCreate: true,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-[#F8F8F7] text-xs font-medium flex items-center gap-2.5"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Note</span>
              </button>

              <button
                data-testid="create-option-canvas"
                type="button"
                onClick={async () => {
                  setCreateMenuOpen(false);
                  await createQuickResource({
                    kind: 'canvas',
                    name: 'Untitled canvas',
                    openAfterCreate: true,
                  });
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-[#F8F8F7] text-xs font-medium flex items-center gap-2.5"
              >
                <FileCode2 className="w-4 h-4 text-purple-600" />
                <span>Canvas</span>
              </button>

              <button
                data-testid="create-option-voice"
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  setActiveCreateModal('voice');
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-[#F8F8F7] text-xs font-medium flex items-center gap-2.5"
              >
                <Mic className="w-4 h-4 text-teal-600" />
                <span>Meeting or voice note</span>
              </button>

              <button
                data-testid="create-option-upload"
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  setActiveCreateModal('upload');
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-[#F8F8F7] text-xs font-medium flex items-center gap-2.5"
              >
                <Upload className="w-4 h-4 text-amber-600" />
                <span>Upload</span>
              </button>

              <button
                data-testid="create-option-link"
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  setActiveCreateModal('link');
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-[#F8F8F7] text-xs font-medium flex items-center gap-2.5"
              >
                <Globe className="w-4 h-4 text-cyan-600" />
                <span>Link</span>
              </button>

              <div className="border-t border-[#E6E6E3] my-1" />

              <button
                data-testid="create-option-space"
                type="button"
                onClick={() => {
                  setCreateMenuOpen(false);
                  setActiveCreateModal('space');
                }}
                className="w-full px-3 py-2 rounded-xl hover:bg-[#F8F8F7] text-xs font-medium flex items-center gap-2.5"
              >
                <FolderPlus className="w-4 h-4 text-[#191918]" />
                <span>Create new space</span>
              </button>
            </div>
          )}
        </div>

        <button
          data-testid="bottom-search-btn"
          type="button"
          onClick={() => setSearchModalOpen(true)}
          className="px-3.5 py-2 rounded-xl hover:bg-[#F3F3F1] text-xs font-medium text-[#6B6B68] hover:text-[#191918] flex items-center gap-2 transition"
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
          <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] bg-[#F3F3F1] rounded">⌘K</kbd>
        </button>

        <button
          data-testid="bottom-assistant-btn"
          type="button"
          onClick={() => setAssistantOpen(!assistantOpen)}
          className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition ${
            assistantOpen
              ? 'bg-[#45BAF9] text-white'
              : 'bg-[#F3F3F1] hover:bg-[#E6E6E3] text-[#191918]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#45BAF9] fill-current" />
          <span>Assistant</span>
        </button>
      </div>

      {/* CREATE LINK MODAL */}
      {activeCreateModal === 'link' && (
        <div
          data-testid="create-link-modal"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveLink}
            className="bg-white rounded-2xl border border-[#E6E6E3] shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Save Web Link</h3>
              <button type="button" onClick={() => setActiveCreateModal(null)}>
                <X className="w-4 h-4 text-[#6B6B68]" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B68] mb-1">Enter URL</label>
              <input
                data-testid="link-url-input"
                type="url"
                required
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://arxiv.org/abs/1706.03762"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B68] mb-1">Title (optional)</label>
              <input
                data-testid="link-title-input"
                type="text"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
                placeholder="Attention Is All You Need — arXiv"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveCreateModal(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E6E3] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                data-testid="save-link-submit"
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium"
              >
                Save Link
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE NEW SPACE MODAL */}
      {activeCreateModal === 'space' && (
        <div
          data-testid="create-space-modal"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveSpace}
            className="bg-white rounded-2xl border border-[#E6E6E3] shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Create new space</h3>
              <button type="button" onClick={() => setActiveCreateModal(null)}>
                <X className="w-4 h-4 text-[#6B6B68]" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B68] mb-1">Space name</label>
              <input
                data-testid="space-name-input"
                type="text"
                required
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                placeholder="e.g. AI Research & Papers"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B6B68] mb-1">Description</label>
              <textarea
                data-testid="space-desc-input"
                value={spaceDesc}
                onChange={(e) => setSpaceDesc(e.target.value)}
                placeholder="What belongs in this space?"
                rows={3}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveCreateModal(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E6E3] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                data-testid="save-space-submit"
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium"
              >
                Create space
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE VOICE / MEETING NOTE MODAL */}
      {activeCreateModal === 'voice' && (
        <div
          data-testid="create-voice-modal"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveVoiceNote}
            className="bg-white rounded-2xl border border-[#E6E6E3] shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Meeting or voice note</h3>
              <button type="button" onClick={() => setActiveCreateModal(null)}>
                <X className="w-4 h-4 text-[#6B6B68]" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#F8F8F7] border border-[#E6E6E3] text-center space-y-3">
              <div className="text-2xl font-mono font-bold text-[#191918]">
                00:{String(recordingSeconds).padStart(2, '0')}
              </div>
              <button
                type="button"
                onClick={() => setIsRecording((r) => !r)}
                className={`px-4 py-2 rounded-full text-xs font-semibold ${
                  isRecording ? 'bg-red-600 text-white' : 'bg-[#191918] text-white'
                }`}
              >
                {isRecording ? 'Pause Recording' : 'Start Recording'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B68] mb-1">Title</label>
              <input
                data-testid="voice-title-input"
                type="text"
                value={voiceTitle}
                onChange={(e) => setVoiceTitle(e.target.value)}
                placeholder="Architecture Sync Voice Note"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B68] mb-1">Live Transcript</label>
              <textarea
                value={voiceTranscript}
                onChange={(e) => setVoiceTranscript(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveCreateModal(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E6E3] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                data-testid="save-voice-submit"
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium"
              >
                Save Voice Note
              </button>
            </div>
          </form>
        </div>
      )}

      {/* UPLOAD FILE MODAL */}
      {activeCreateModal === 'upload' && (
        <div
          data-testid="create-upload-modal"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveUpload}
            className="bg-white rounded-2xl border border-[#E6E6E3] shadow-2xl max-w-md w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Upload File to Workspace</h3>
              <button type="button" onClick={() => setActiveCreateModal(null)}>
                <X className="w-4 h-4 text-[#6B6B68]" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B68] mb-1">File Name</label>
              <input
                data-testid="upload-name-input"
                type="text"
                required
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="Q4-System-Design-Spec.pdf"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B6B68] mb-1">Media Kind</label>
              <select
                value={uploadKind}
                onChange={(e) =>
                  setUploadKind(e.target.value as 'document' | 'image' | 'video' | 'audio')
                }
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
              >
                <option value="document">PDF Document</option>
                <option value="image">High-Res Image</option>
                <option value="video">MP4 Video</option>
                <option value="audio">MP3 Audio</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveCreateModal(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E6E3] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                data-testid="save-upload-submit"
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium"
              >
                Upload & Index
              </button>
            </div>
          </form>
        </div>
      )}

      {/* GLOBAL SEARCH & AI COMMAND OVERLAY (Cmd+K) */}
      {searchModalOpen && (
        <div
          data-testid="global-search-modal"
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-start justify-center pt-20 p-4"
        >
          <div className="bg-white rounded-2xl border border-[#E6E6E3] shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="p-4 border-b border-[#E6E6E3] flex items-center gap-3">
              <Search className="w-4 h-4 text-[#6B6B68]" />
              <input
                data-testid="global-search-input"
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes, PDFs, canvases, links, or ask Rue AI..."
                className="flex-1 text-sm bg-transparent focus:outline-none"
              />
              <button
                data-testid="close-search-modal"
                type="button"
                onClick={() => setSearchModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#F3F3F1]"
              >
                <X className="w-4 h-4 text-[#6B6B68]" />
              </button>
            </div>

            {/* Kind Filter Pills */}
            <div className="px-4 py-2 bg-[#F8F8F7] border-b border-[#E6E6E3] flex items-center gap-1.5 overflow-x-auto text-xs">
              {[
                ['', 'All'],
                ['notepad', 'Notes'],
                ['canvas', 'Canvases'],
                ['document', 'PDFs'],
                ['image', 'Images'],
                ['video', 'Videos'],
                ['audio', 'Audio'],
                ['link', 'Links'],
              ].map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSearchKind(k)}
                  className={`px-2.5 py-1 rounded-lg font-medium ${
                    searchKind === k ? 'bg-[#191918] text-white' : 'bg-white border border-[#E6E6E3]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#E6E6E3]">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  data-testid={`search-result-${r.id}`}
                  type="button"
                  onClick={() => {
                    setSearchModalOpen(false);
                    openExpandedResource(r.id);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-[#F8F8F7] flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-[#191918]">{r.name}</div>
                    {r.description && (
                      <div className="text-[11px] text-[#6B6B68] line-clamp-1">{r.description}</div>
                    )}
                  </div>
                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#F3F3F1] text-[#6B6B68]">
                    {r.kind}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expanded Resource Split-Screen Viewer (?expandedFdocId=<id>) */}
      <ExpandedResourceModal />

      {/* Right-hand Rue AI Assistant Drawer */}
      <RueAssistantDrawer />
    </div>
  );
}
