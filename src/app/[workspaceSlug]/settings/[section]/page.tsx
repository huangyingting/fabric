'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User,
  Sliders,
  Sparkles,
  Wand2,
  BadgeCheck,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  UploadCloud,
  Cpu,
  KeyRound,
  Ticket,
  ShieldAlert,
  ScrollText,
  Copy,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

const SETTINGS_TABS = [
  { id: 'account', label: 'Account', icon: User, group: 'Personal' },
  { id: 'preferences', label: 'Preferences', icon: Sliders, group: 'Personal' },
  { id: 'ais', label: 'Your AIs', icon: Sparkles, group: 'AI & Automation' },
  { id: 'ai-actions', label: 'AI Actions', icon: Wand2, group: 'AI & Automation' },
  { id: 'profile', label: 'Public Profile', icon: BadgeCheck, group: 'Personal' },
  { id: 'workspace', label: 'Workspace', icon: Building2, group: 'Workspace' },
  { id: 'members', label: 'Members', icon: Users, group: 'Workspace' },
  { id: 'billing', label: 'Billing', icon: CreditCard, group: 'Workspace' },
  { id: 'usage', label: 'Usage', icon: BarChart3, group: 'Workspace' },
  { id: 'import', label: 'Import', icon: UploadCloud, group: 'Developer & Data' },
  { id: 'mcp', label: 'MCP Server', icon: Cpu, group: 'Developer & Data' },
  { id: 'api-keys', label: 'API Keys', icon: KeyRound, group: 'Developer & Data' },
  { id: 'invitations', label: 'Invitations (Admin)', icon: Ticket, group: 'Admin Governance' },
  { id: 'users', label: 'Users & Roles (Admin)', icon: ShieldAlert, group: 'Admin Governance' },
  { id: 'audit-logs', label: 'Audit Logs (Admin)', icon: ScrollText, group: 'Admin Governance' },
];

export default function SettingsSectionPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; section: string }>;
}) {
  const { workspaceSlug, section } = use(params);
  const {
    workspace,
    currentUser,
    aiActions,
    activeAiProvider,
    setActiveAiProvider,
    activeAiModel,
    setActiveAiModel,
    refreshWorkspace,
    createQuickResource,
  } = useWorkspace();

  // API keys state
  const [apiKeys, setApiKeys] = useState<
    Array<{ id: string; name: string; keyPrefix: string; createdAt: string }>
  >([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);

  // AI Actions state
  const [actionName, setActionName] = useState('');
  const [actionPrompt, setActionPrompt] = useState('');

  // Admin Invitations state
  const [invitations, setInvitations] = useState<
    Array<{
      id: string;
      codeHint: string;
      email: string | null;
      role: string;
      status: string;
      expiresAt: string;
      createdAt: string;
    }>
  >([]);
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Editor' | 'Viewer'>('Editor');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteHours, setInviteHours] = useState(168);
  const [newRawInviteCode, setNewRawInviteCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Admin Users state
  const [adminUsers, setAdminUsers] = useState<
    Array<{
      id: string;
      email: string;
      name: string | null;
      role: string;
      revokedAt: string | null;
      createdAt: string;
    }>
  >([]);

  // Admin Audit Logs state
  const [auditLogs, setAuditLogs] = useState<
    Array<{
      id: string;
      action: string;
      entityType: string;
      entityId: string | null;
      metadata: string | null;
      createdAt: string;
      actor?: { email: string; name: string | null; role: string } | null;
    }>
  >([]);
  const [auditFilter, setAuditFilter] = useState('');

  // Workspace name state
  const [wsName, setWsName] = useState(workspace?.name || '');

  useEffect(() => {
    if (workspace?.name) setWsName(workspace.name);
  }, [workspace?.name]);

  useEffect(() => {
    if (section === 'api-keys') {
      fetch('/api/settings/api-keys')
        .then((r) => r.json())
        .then((d) => setApiKeys(d.keys || []));
    } else if (section === 'invitations') {
      fetch('/api/admin/invitations')
        .then((r) => r.json())
        .then((d) => setInvitations(d.invitations || []));
    } else if (section === 'users' || section === 'members') {
      fetch('/api/admin/users')
        .then((r) => r.json())
        .then((d) => setAdminUsers(d.users || []));
    } else if (section === 'audit-logs') {
      const q = auditFilter ? `?action=${encodeURIComponent(auditFilter)}` : '';
      fetch(`/api/admin/audit-logs${q}`)
        .then((r) => r.json())
        .then((d) => setAuditLogs(d.logs || []));
    }
  }, [section, auditFilter]);

  async function handleGenerateInvite(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: inviteRole,
        email: inviteEmail.trim() || undefined,
        expiresInHours: inviteHours,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setNewRawInviteCode(data.rawCode);
      setInviteEmail('');
      const refreshed = await fetch('/api/admin/invitations').then((r) => r.json());
      setInvitations(refreshed.invitations || []);
    }
  }

  async function handleRevokeInvite(id: string) {
    await fetch(`/api/admin/invitations?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const refreshed = await fetch('/api/admin/invitations').then((r) => r.json());
    setInvitations(refreshed.invitations || []);
  }

  async function handleUpdateUserRole(userId: string, role: string) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'update_role', role }),
    });
    const refreshed = await fetch('/api/admin/users').then((r) => r.json());
    setAdminUsers(refreshed.users || []);
  }

  async function handleToggleUserRevoke(userId: string, isRevoked: boolean) {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        action: isRevoked ? 'restore_user' : 'revoke_user',
      }),
    });
    const refreshed = await fetch('/api/admin/users').then((r) => r.json());
    setAdminUsers(refreshed.users || []);
  }

  async function handleCreateApiKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    const res = await fetch('/api/settings/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setGeneratedRawKey(data.rawKey);
      setNewKeyName('');
      const refreshed = await fetch('/api/settings/api-keys').then((r) => r.json());
      setApiKeys(refreshed.keys || []);
    }
  }

  async function handleRevokeApiKey(id: string) {
    await fetch(`/api/settings/api-keys?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const refreshed = await fetch('/api/settings/api-keys').then((r) => r.json());
    setApiKeys(refreshed.keys || []);
  }

  async function handleCreateAiAction(e: React.FormEvent) {
    e.preventDefault();
    if (!actionName.trim() || !actionPrompt.trim()) return;
    await fetch('/api/ai/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceSlug,
        name: actionName.trim(),
        prompt: actionPrompt.trim(),
      }),
    });
    setActionName('');
    setActionPrompt('');
    await refreshWorkspace();
  }

  async function handleSaveAiSettings(provider: 'copilot-sdk' | 'azure-openai', model: string) {
    setActiveAiProvider(provider);
    setActiveAiModel(model);
    await fetch('/api/workspaces', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceSlug,
        aiProvider: provider,
        aiModel: model,
      }),
    });
    await refreshWorkspace();
  }

  return (
    <div data-testid={`settings-page-${section}`} className="max-w-7xl mx-auto p-6 sm:p-8 flex flex-col md:flex-row gap-8">
      {/* Left Settings Navigation */}
      <aside className="w-full md:w-60 shrink-0 space-y-1">
        <h1 className="text-lg font-semibold text-[#191918] px-3 mb-3">Settings</h1>
        {SETTINGS_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = section === tab.id;
          return (
            <Link
              key={tab.id}
              data-testid={`settings-tab-${tab.id}`}
              href={`/${workspaceSlug}/settings/${tab.id}`}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                active
                  ? 'bg-[#191918] text-white'
                  : 'text-[#6B6B68] hover:text-[#191918] hover:bg-[#E6E6E3]/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </aside>

      {/* Right Settings Content Panel */}
      <div className="flex-1 bg-white rounded-2xl border border-[#E6E6E3] p-6 sm:p-8 space-y-6">
        {/* 1. ACCOUNT */}
        {section === 'account' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Account Details</h2>
              <p className="text-xs text-[#6B6B68]">Manage your personal credentials and role</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F8F8F7] border border-[#E6E6E3]">
                <div className="text-[11px] text-[#6B6B68]">Email Address</div>
                <div className="text-sm font-semibold mt-0.5">{currentUser?.email}</div>
              </div>
              <div className="p-4 rounded-xl bg-[#F8F8F7] border border-[#E6E6E3]">
                <div className="text-[11px] text-[#6B6B68]">Assigned RBAC Role</div>
                <div className="text-sm font-semibold mt-0.5">{currentUser?.role}</div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PREFERENCES */}
        {section === 'preferences' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Preferences</h2>
              <p className="text-xs text-[#6B6B68]">Customize interface appearance and default views</p>
            </div>
            <div className="space-y-4 max-w-md">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#F8F8F7] border border-[#E6E6E3]">
                <div>
                  <div className="text-xs font-semibold">Theme</div>
                  <div className="text-[11px] text-[#6B6B68]">Warm Alabaster Light (Fabric Default)</div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-[#E6E6E3] text-xs font-medium">
                  Light
                </span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#F8F8F7] border border-[#E6E6E3]">
                <div>
                  <div className="text-xs font-semibold">Semantic Auto-Tagging</div>
                  <div className="text-[11px] text-[#6B6B68]">Automatically suggest tags on new captures</div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  Enabled
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 3. YOUR AIs (PLUGGABLE AI PROVIDER CONFIGURATION) */}
        {section === 'ais' && (
          <div data-testid="settings-ais-section" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Your AIs — Rue Persona & Pluggable AI Engine</h2>
              <p className="text-xs text-[#6B6B68]">
                Switch seamlessly between GitHub Copilot SDK (`@github/copilot-sdk`) and Azure OpenAI
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                data-testid="settings-select-copilot-sdk"
                type="button"
                onClick={() => handleSaveAiSettings('copilot-sdk', activeAiModel)}
                className={`p-5 rounded-2xl border text-left space-y-2 transition ${
                  activeAiProvider === 'copilot-sdk'
                    ? 'border-[#191918] bg-[#F8F8F7] ring-2 ring-[#191918]/10'
                    : 'border-[#E6E6E3] hover:border-[#191918]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">GitHub Copilot SDK</span>
                  {activeAiProvider === 'copilot-sdk' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6B6B68]">
                  Uses `@github/copilot-sdk` (`CopilotClient`) to invoke Copilot models (`gpt-4.1`, `claude-sonnet-4`, `o3-mini`).
                </p>
              </button>

              <button
                data-testid="settings-select-azure-openai"
                type="button"
                onClick={() => handleSaveAiSettings('azure-openai', activeAiModel)}
                className={`p-5 rounded-2xl border text-left space-y-2 transition ${
                  activeAiProvider === 'azure-openai'
                    ? 'border-[#191918] bg-[#F8F8F7] ring-2 ring-[#191918]/10'
                    : 'border-[#E6E6E3] hover:border-[#191918]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Azure OpenAI Service</span>
                  {activeAiProvider === 'azure-openai' && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6B6B68]">
                  Pluggable enterprise Azure OpenAI Chat Completions provider (`AZURE_OPENAI_ENDPOINT` + deployment).
                </p>
              </button>
            </div>
          </div>
        )}

        {/* 4. AI ACTIONS */}
        {section === 'ai-actions' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">AI Actions</h2>
              <p className="text-xs text-[#6B6B68]">
                One-click reusable prompt macros available in Rue Assistant and note editors
              </p>
            </div>

            <form onSubmit={handleCreateAiAction} className="p-4 rounded-xl bg-[#F8F8F7] border border-[#E6E6E3] space-y-3">
              <div className="text-xs font-semibold">Create Custom AI Action</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  data-testid="new-ai-action-name"
                  type="text"
                  required
                  value={actionName}
                  onChange={(e) => setActionName(e.target.value)}
                  placeholder="Action name (e.g. Extract Key Risks)"
                  className="px-3 py-2 text-xs rounded-xl border border-[#E6E6E3] bg-white"
                />
                <input
                  data-testid="new-ai-action-prompt"
                  type="text"
                  required
                  value={actionPrompt}
                  onChange={(e) => setActionPrompt(e.target.value)}
                  placeholder="Prompt template..."
                  className="px-3 py-2 text-xs rounded-xl border border-[#E6E6E3] bg-white"
                />
              </div>
              <button
                data-testid="save-ai-action-btn"
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#191918] text-white text-xs font-medium"
              >
                Save AI Action
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {aiActions.map((act) => (
                <div key={act.id} className="p-4 rounded-xl border border-[#E6E6E3] space-y-1">
                  <div className="text-xs font-semibold">✨ {act.name}</div>
                  <div className="text-[11px] text-[#6B6B68]">{act.prompt}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. PUBLIC PROFILE */}
        {section === 'profile' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Public Profile</h2>
            <p className="text-xs text-[#6B6B68]">
              Public handle: <code className="px-1.5 py-0.5 rounded bg-[#F3F3F1]">fabric.so/@{workspaceSlug}</code>
            </p>
          </div>
        )}

        {/* 6. WORKSPACE */}
        {section === 'workspace' && (
          <div className="space-y-4 max-w-md">
            <h2 className="text-lg font-semibold">Workspace Settings</h2>
            <div>
              <label className="block text-xs text-[#6B6B68] mb-1">Workspace Name</label>
              <input
                type="text"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/workspaces', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ workspaceSlug, name: wsName }),
                });
                await refreshWorkspace();
              }}
              className="px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium"
            >
              Update Workspace
            </button>
          </div>
        )}

        {/* 7. MEMBERS */}
        {section === 'members' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Workspace Members</h2>
                <p className="text-xs text-[#6B6B68]">Collaborators with access to this workspace</p>
              </div>
              <Link
                href={`/${workspaceSlug}/settings/invitations`}
                className="px-3.5 py-1.5 rounded-xl bg-[#191918] text-white text-xs font-medium"
              >
                Manage Invitations
              </Link>
            </div>
            <div className="divide-y divide-[#E6E6E3]">
              {adminUsers.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold">{u.name || u.email}</div>
                    <div className="text-[11px] text-[#6B6B68]">{u.email}</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F3F3F1] text-xs font-semibold">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. BILLING */}
        {section === 'billing' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Billing & Subscription</h2>
            <div className="p-5 rounded-2xl bg-[#F8F8F7] border border-[#E6E6E3] flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Current Plan: Fabric {workspace?.planTier?.toUpperCase() || 'FREE'}</div>
                <p className="text-xs text-[#6B6B68]">Includes multimodal capture, spaces, and Rue AI Assistant.</p>
              </div>
              <Link
                href={`/${workspaceSlug}/pricing`}
                className="px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium"
              >
                View Pricing Plans
              </Link>
            </div>
          </div>
        )}

        {/* 9. USAGE */}
        {section === 'usage' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Workspace Usage & Quotas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#F8F8F7] border border-[#E6E6E3]">
                <div className="text-xs text-[#6B6B68]">Storage Used</div>
                <div className="text-lg font-bold mt-1">44.2 MB / 5 GB</div>
              </div>
              <div className="p-4 rounded-xl bg-[#F8F8F7] border border-[#E6E6E3]">
                <div className="text-xs text-[#6B6B68]">AI Credits</div>
                <div className="text-lg font-bold mt-1">Unlimited (Copilot SDK)</div>
              </div>
              <div className="p-4 rounded-xl bg-[#F8F8F7] border border-[#E6E6E3]">
                <div className="text-xs text-[#6B6B68]">Scheduled Agents</div>
                <div className="text-lg font-bold mt-1">Active</div>
              </div>
            </div>
          </div>
        )}

        {/* 10. IMPORT */}
        {section === 'import' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Import Knowledge into Fabric</h2>
            <p className="text-xs text-[#6B6B68]">
              Import notes, bookmarks, and markdown vaults from Notion, Obsidian, Raindrop.io, or Apple Notes.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {['Notion Workspace (.zip / API)', 'Obsidian Markdown Vault', 'Raindrop.io Bookmarks', 'Apple Notes & Evernote'].map(
                (src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() =>
                      createQuickResource({
                        kind: 'notepad',
                        name: `Imported from ${src}`,
                        content: `# ${src} Import\n\nSuccessfully imported into Fabric workspace.`,
                        openAfterCreate: true,
                      })
                    }
                    className="p-4 rounded-xl border border-[#E6E6E3] hover:border-[#191918] text-left text-xs font-semibold"
                  >
                    📥 Import {src}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* 11. MCP SERVER */}
        {section === 'mcp' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Model Context Protocol (MCP) Server</h2>
            <p className="text-xs text-[#6B6B68]">
              Connect Claude Desktop, Cursor, or GitHub Copilot to your Fabric knowledge graph via MCP.
            </p>
            <pre className="p-4 rounded-xl bg-[#191918] text-emerald-400 text-xs overflow-x-auto">
{`{
  "mcpServers": {
    "fabric-workspace": {
      "command": "npx",
      "args": ["-y", "@fabric/mcp-server", "--workspace", "${workspaceSlug}"]
    }
  }
}`}
            </pre>
          </div>
        )}

        {/* 12. API KEYS */}
        {section === 'api-keys' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Personal API Keys</h2>
              <p className="text-xs text-[#6B6B68]">Authenticate REST API and MCP requests</p>
            </div>

            <form onSubmit={handleCreateApiKey} className="flex items-center gap-2">
              <input
                data-testid="api-key-name-input"
                type="text"
                required
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key label (e.g. Raycast Extension)"
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
              />
              <button
                data-testid="create-api-key-btn"
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium"
              >
                Generate Key
              </button>
            </form>

            {generatedRawKey && (
              <div
                data-testid="generated-api-key-banner"
                className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1"
              >
                <div className="font-semibold text-emerald-900">Copy your secret API key now:</div>
                <code className="font-mono text-emerald-800 break-all">{generatedRawKey}</code>
              </div>
            )}

            <div className="divide-y divide-[#E6E6E3]">
              {apiKeys.map((k) => (
                <div key={k.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold">{k.name}</div>
                    <div className="font-mono text-[#6B6B68]">{k.keyPrefix}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevokeApiKey(k.id)}
                    className="text-red-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Revoke
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 13. ADMIN GOVERNANCE: INVITATIONS */}
        {section === 'invitations' && (
          <div data-testid="admin-invitations-panel" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Invite-Only Registration & Single-Use Codes</h2>
              <p className="text-xs text-[#6B6B68]">
                Generate single-use, expiring invitation codes with role assignment (`Admin`, `Editor`, `Viewer`) and instant revocation.
              </p>
            </div>

            <form
              onSubmit={handleGenerateInvite}
              className="p-4 rounded-2xl bg-[#F8F8F7] border border-[#E6E6E3] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
            >
              <div>
                <label className="block text-[11px] font-medium text-[#6B6B68] mb-1">Role</label>
                <select
                  data-testid="invite-role-select"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'Admin' | 'Editor' | 'Viewer')}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E6E3] bg-white"
                >
                  <option value="Editor">Editor</option>
                  <option value="Viewer">Viewer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B6B68] mb-1">
                  Restrict to Email (Optional)
                </label>
                <input
                  data-testid="invite-email-input"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="any@company.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E6E3] bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6B6B68] mb-1">
                  Expires In (Hours)
                </label>
                <input
                  data-testid="invite-hours-input"
                  type="number"
                  min={1}
                  max={720}
                  value={inviteHours}
                  onChange={(e) => setInviteHours(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E6E6E3] bg-white"
                />
              </div>

              <button
                data-testid="generate-invite-btn"
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Generate Code
              </button>
            </form>

            {newRawInviteCode && (
              <div
                data-testid="new-invite-code-banner"
                className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between"
              >
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-emerald-950">
                    Single-Use Invitation Code Generated (shown only once):
                  </div>
                  <code
                    data-testid="generated-invite-code-value"
                    className="text-sm font-mono font-bold text-emerald-800"
                  >
                    {newRawInviteCode}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(newRawInviteCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-xs font-medium flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'Copied' : 'Copy Code'}
                </button>
              </div>
            )}

            <div className="divide-y divide-[#E6E6E3]">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  data-testid={`invitation-row-${inv.id}`}
                  className="py-3 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-mono font-semibold text-[#191918]">
                      {inv.codeHint} · <span className="font-sans font-medium">{inv.role}</span>
                    </div>
                    <div className="text-[11px] text-[#6B6B68]">
                      {inv.email ? `Locked to ${inv.email} · ` : ''}Expires{' '}
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      data-testid={`invitation-status-${inv.id}`}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        inv.status === 'PENDING'
                          ? 'bg-amber-50 text-amber-800'
                          : inv.status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {inv.status}
                    </span>

                    {inv.status === 'PENDING' && (
                      <button
                        data-testid={`revoke-invite-${inv.id}`}
                        type="button"
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 14. ADMIN GOVERNANCE: USERS & ROLES */}
        {section === 'users' && (
          <div data-testid="admin-users-panel" className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Users, Roles & Access Revocation</h2>
              <p className="text-xs text-[#6B6B68]">
                Manage RBAC roles (`Admin`, `Editor`, `Viewer`) and revoke or restore user accounts
              </p>
            </div>

            <div className="divide-y divide-[#E6E6E3]">
              {adminUsers.map((u) => {
                const isRevoked = Boolean(u.revokedAt);
                return (
                  <div
                    key={u.id}
                    data-testid={`admin-user-row-${u.email}`}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#191918] flex items-center gap-2">
                        <span>{u.name || u.email}</span>
                        {isRevoked && (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">
                            REVOKED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#6B6B68]">{u.email}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        data-testid={`role-select-${u.email}`}
                        value={u.role}
                        onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#E6E6E3] bg-[#F8F8F7] text-xs font-medium"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Editor">Editor</option>
                        <option value="Viewer">Viewer</option>
                      </select>

                      {u.email !== currentUser?.email && (
                        <button
                          data-testid={`toggle-revoke-${u.email}`}
                          type="button"
                          onClick={() => handleToggleUserRevoke(u.id, isRevoked)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            isRevoked
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {isRevoked ? 'Restore Access' : 'Revoke Access'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 15. ADMIN GOVERNANCE: AUDIT LOGS */}
        {section === 'audit-logs' && (
          <div data-testid="admin-audit-logs-panel" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Security & Governance Audit Logs</h2>
                <p className="text-xs text-[#6B6B68]">
                  Immutable trail of authentication, invitations, role changes, AI actions, and resource mutations
                </p>
              </div>
              <input
                data-testid="audit-filter-input"
                type="text"
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                placeholder="Filter by action (e.g. invitation, resource)..."
                className="px-3 py-1.5 text-xs rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
              />
            </div>

            <div className="divide-y divide-[#E6E6E3] max-h-[540px] overflow-y-auto">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  data-testid={`audit-log-entry-${log.action}`}
                  className="py-3 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-mono font-semibold text-[#191918]">{log.action}</div>
                    <div className="text-[11px] text-[#6B6B68]">
                      Actor: {log.actor?.email || 'system'} · Entity: {log.entityType}{' '}
                      {log.entityId ? `(${log.entityId})` : ''}
                    </div>
                    {log.metadata && (
                      <div className="text-[10px] font-mono text-[#9B9B97] break-all">
                        {log.metadata}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-[#9B9B97] shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
