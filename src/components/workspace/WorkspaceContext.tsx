'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export type ViewMode = 'grid' | 'masonry' | 'list' | 'compact';

export interface TagItem {
  id: string;
  name: string;
  color: string;
  _count?: { resources: number };
}

export interface CommentItem {
  id: string;
  resourceId: string;
  body: string;
  timestamp?: number | null;
  page?: number | null;
  pinX?: number | null;
  pinY?: number | null;
  resolved: boolean;
  createdAt: string;
  author: { id: string; name?: string | null; email: string };
}

export interface ResourceItem {
  id: string;
  workspaceId: string;
  parentId?: string | null;
  root: string;
  kind: string;
  name: string;
  description?: string | null;
  mimeType: string;
  extension?: string | null;
  size: number;
  url?: string | null;
  originUrl?: string | null;
  thumbnail?: string | null;
  cover?: string | null;
  icon?: string | null;
  content?: string | null;
  data?: string | null;
  isShared: boolean;
  isPinned: boolean;
  isLocked: boolean;
  isPasswordProtected: boolean;
  sharePermission: string;
  shareToken?: string | null;
  createdAt: string;
  modifiedAt: string;
  deletedAt?: string | null;
  tags?: Array<{ id: string; tagId: string; tag: TagItem }>;
  comments?: CommentItem[];
  parent?: { id: string; name: string; kind: string } | null;
  _count?: { children?: number; comments?: number };
}

export interface WorkspaceData {
  id: string;
  slug: string;
  name: string;
  type: string;
  planTier: string;
  referralCode: string;
  storageUsedBytes: number;
  storageLimitBytes: number;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
  settings?: string | null;
}

export interface AiAgentItem {
  id: string;
  name: string;
  emailAddress: string;
  personality: string;
  color: string;
  shape: number;
  instructions?: string | null;
  isDefault: boolean;
}

export interface AiActionItem {
  id: string;
  name: string;
  prompt: string;
  icon: string;
  isBuiltIn: boolean;
}

export interface AiTaskItem {
  id: string;
  name: string;
  title?: string;
  instructions: string;
  prompt?: string;
  frequency: string;
  day?: string | null;
  hour: string;
  timeOfDay?: string;
  accessScope: string;
  personality: string;
  emailEnabled: boolean;
  status: string;
  lastRunAt?: string | null;
  lastResultSummary?: string | null;
  lastResultResourceId?: string | null;
  createdAt: string;
}

export interface ConnectionItem {
  id: string;
  provider: string;
  name: string;
  displayName?: string;
  category: string;
  description?: string | null;
  status: string;
  syncedCount: number;
  syncedItems?: number;
  lastSyncedAt?: string | null;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
}

interface WorkspaceContextValue {
  workspaceSlug: string;
  workspace: WorkspaceData | null;
  workspaces: WorkspaceData[];
  resources: ResourceItem[];
  spaces: ResourceItem[];
  tags: TagItem[];
  aiAgents: AiAgentItem[];
  aiActions: AiActionItem[];
  aiTasks: AiTaskItem[];
  scheduledTasks: AiTaskItem[];
  connections: ConnectionItem[];
  notifications: NotificationItem[];
  apiKeys: ApiKeyItem[];
  currentUser: { id: string; email: string; name?: string | null; role: string } | null;
  loading: boolean;

  // Pluggable AI state
  activeAiProvider: 'copilot-sdk' | 'azure-openai';
  setActiveAiProvider: (v: 'copilot-sdk' | 'azure-openai') => void;
  activeAiModel: string;
  setActiveAiModel: (v: string) => void;

  // UI state
  sidebarExpanded: boolean;
  setSidebarExpanded: (v: boolean) => void;
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
  assistantOpen: boolean;
  setAssistantOpen: (v: boolean) => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (v: boolean) => void;
  activeCreateModal: null | 'link' | 'space' | 'voice' | 'upload';
  setActiveCreateModal: (v: null | 'link' | 'space' | 'voice' | 'upload') => void;

  // View preferences
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  thumbnailSize: 'sm' | 'md' | 'lg';
  setThumbnailSize: (v: 'sm' | 'md' | 'lg') => void;
  cardDetails: { showDescription: boolean; showTags: boolean; showDate: boolean; showKind: boolean };
  setCardDetails: React.Dispatch<
    React.SetStateAction<{ showDescription: boolean; showTags: boolean; showDate: boolean; showKind: boolean }>
  >;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortDir: 'asc' | 'desc';
  setSortDir: (v: 'asc' | 'desc') => void;

  // Expanded Resource (?expandedFdocId=<id>)
  expandedResourceId: string | null;
  openExpandedResource: (id: string) => void;
  closeExpandedResource: () => void;

  // Actions
  refreshWorkspace: () => Promise<void>;
  createQuickResource: (params: {
    kind: string;
    name?: string;
    description?: string;
    url?: string;
    content?: string;
    parentId?: string | null;
    root?: string;
    openAfterCreate?: boolean;
  }) => Promise<ResourceItem | null>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  workspaceSlug,
  children,
}: {
  workspaceSlug: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [spaces, setSpaces] = useState<ResourceItem[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [aiAgents, setAiAgents] = useState<AiAgentItem[]>([]);
  const [aiActions, setAiActions] = useState<AiActionItem[]>([]);
  const [aiTasks, setAiTasks] = useState<AiTaskItem[]>([]);
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email: string;
    name?: string | null;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeAiProvider, setActiveAiProvider] = useState<'copilot-sdk' | 'azure-openai'>('copilot-sdk');
  const [activeAiModel, setActiveAiModel] = useState<string>('gpt-4.1');

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [activeCreateModal, setActiveCreateModal] = useState<null | 'link' | 'space' | 'voice' | 'upload'>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [thumbnailSize, setThumbnailSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [cardDetails, setCardDetails] = useState({
    showDescription: true,
    showTags: true,
    showDate: true,
    showKind: true,
  });
  const [sortBy, setSortBy] = useState('modifiedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const expandedResourceId = searchParams.get('expandedFdocId');

  const refreshWorkspace = useCallback(async () => {
    try {
      const res = await fetch(`/api/workspaces?slug=${encodeURIComponent(workspaceSlug)}`);
      if (!res.ok) return;
      const data = await res.json();
      setWorkspace(data.workspace);
      setWorkspaces(data.workspaces || []);
      setResources(data.resources || []);
      setSpaces(data.spaces || []);
      setTags(data.tags || []);
      setAiAgents(data.aiAgents || []);
      setAiActions(data.aiActions || []);
      const normalizedTasks = (data.aiTasks || []).map((t: AiTaskItem) => ({
        ...t,
        title: t.name,
        prompt: t.instructions,
        timeOfDay: t.hour,
      }));
      setAiTasks(normalizedTasks);
      const normalizedConnections = (data.connections || []).map((c: ConnectionItem) => ({
        ...c,
        displayName: c.name,
        syncedItems: c.syncedCount,
      }));
      setConnections(normalizedConnections);
      setNotifications(data.notifications || []);
      setApiKeys(data.apiKeys || []);
      setCurrentUser(data.user || null);
      if (data.workspace?.settings) {
        try {
          const parsed = JSON.parse(data.workspace.settings);
          if (parsed.aiProvider === 'azure-openai' || parsed.aiProvider === 'copilot-sdk') {
            setActiveAiProvider(parsed.aiProvider);
          }
          if (parsed.aiModel) {
            setActiveAiModel(parsed.aiModel);
          }
        } catch {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug]);

  useEffect(() => {
    refreshWorkspace();
  }, [refreshWorkspace]);

  // Global keyboard shortcuts (Cmd+K for search, Cmd+J for assistant)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setAssistantOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const openExpandedResource = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('expandedFdocId', id);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const closeExpandedResource = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('expandedFdocId');
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const createQuickResource = useCallback(
    async (params: {
      kind: string;
      name?: string;
      description?: string;
      url?: string;
      content?: string;
      parentId?: string | null;
      root?: string;
      openAfterCreate?: boolean;
    }): Promise<ResourceItem | null> => {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: workspace?.id,
          workspaceSlug,
          ...params,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      await refreshWorkspace();
      if (params.openAfterCreate && data.resource?.id) {
        if (params.kind === 'folder') {
          router.push(`/${workspaceSlug}/spaces/${data.resource.id}`);
        } else {
          openExpandedResource(data.resource.id);
        }
      }
      return data.resource;
    },
    [workspace?.id, workspaceSlug, refreshWorkspace, router, openExpandedResource]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        workspaceSlug,
        workspace,
        workspaces,
        resources,
        spaces,
        tags,
        aiAgents,
        aiActions,
        aiTasks,
        scheduledTasks: aiTasks,
        connections,
        notifications,
        apiKeys,
        currentUser,
        loading,
        activeAiProvider,
        setActiveAiProvider,
        activeAiModel,
        setActiveAiModel,
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
        viewMode,
        setViewMode,
        thumbnailSize,
        setThumbnailSize,
        cardDetails,
        setCardDetails,
        sortBy,
        setSortBy,
        sortDir,
        setSortDir,
        expandedResourceId,
        openExpandedResource,
        closeExpandedResource,
        refreshWorkspace,
        createQuickResource,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return ctx;
}
