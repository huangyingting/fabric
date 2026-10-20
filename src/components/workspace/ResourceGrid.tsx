'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Folder,
  Image as ImageIcon,
  Video,
  Music,
  Globe,
  LayoutGrid,
  List,
  Rows3,
  Columns3,
  SlidersHorizontal,
  ArrowUpDown,
  Pin,
  Share2,
  Trash2,
  MessageSquare,
  Mic,
  FileCode2,
  RotateCcw,
} from 'lucide-react';
import { ResourceItem, useWorkspace, ViewMode } from './WorkspaceContext';

export function getResourceKindBadge(kind: string, extension?: string | null) {
  switch (kind) {
    case 'folder':
      return { label: 'SPACE', color: 'bg-amber-100 text-amber-800', icon: Folder };
    case 'notepad':
      return { label: 'NOTE', color: 'bg-blue-100 text-blue-800', icon: FileText };
    case 'canvas':
      return { label: 'CANVAS', color: 'bg-purple-100 text-purple-800', icon: FileCode2 };
    case 'document':
      return { label: (extension || 'PDF').toUpperCase(), color: 'bg-rose-100 text-rose-800', icon: FileText };
    case 'video':
      return { label: (extension || 'MP4').toUpperCase(), color: 'bg-indigo-100 text-indigo-800', icon: Video };
    case 'audio':
      return { label: (extension || 'MP3').toUpperCase(), color: 'bg-emerald-100 text-emerald-800', icon: Music };
    case 'voice_note':
      return { label: 'VOICE', color: 'bg-teal-100 text-teal-800', icon: Mic };
    case 'image':
      return { label: (extension || 'IMG').toUpperCase(), color: 'bg-pink-100 text-pink-800', icon: ImageIcon };
    case 'link':
      return { label: 'LINK', color: 'bg-cyan-100 text-cyan-800', icon: Globe };
    default:
      return { label: kind.toUpperCase(), color: 'bg-gray-100 text-gray-700', icon: FileText };
  }
}

export function ResourceViewToolbar({
  itemCount,
  onRefresh,
}: {
  itemCount: number;
  onRefresh?: () => void;
}) {
  const {
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
  } = useWorkspace();

  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const viewOptions: Array<{ id: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'grid', label: 'Grid', icon: LayoutGrid },
    { id: 'masonry', label: 'Masonry', icon: Columns3 },
    { id: 'list', label: 'List', icon: List },
    { id: 'compact', label: 'Compact', icon: Rows3 },
  ];

  const sortOptions = [
    { id: 'modifiedAt', label: 'Last modified' },
    { id: 'createdAt', label: 'Date added' },
    { id: 'name', label: 'Name' },
    { id: 'size', label: 'Size' },
    { id: 'kind', label: 'Kind' },
  ];

  return (
    <div className="flex items-center justify-between gap-2 py-2">
      <div className="text-xs text-[#6B6B68] font-medium">
        <span data-testid="resource-count">{itemCount}</span> {itemCount === 1 ? 'item' : 'items'}
      </div>

      <div className="flex items-center gap-2 relative">
        {/* Sort Selector */}
        <div className="relative">
          <button
            data-testid="sort-menu-button"
            type="button"
            onClick={() => {
              setSortMenuOpen((v) => !v);
              setViewMenuOpen(false);
            }}
            className="px-3 py-1.5 rounded-lg border border-[#E6E6E3] bg-white hover:bg-[#F3F3F1] text-xs font-medium flex items-center gap-1.5"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#6B6B68]" />
            <span>{sortOptions.find((s) => s.id === sortBy)?.label || 'Sort'}</span>
          </button>

          {sortMenuOpen && (
            <div
              data-testid="sort-menu-popover"
              className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white border border-[#E6E6E3] shadow-lg p-1.5 z-30"
            >
              {sortOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setSortBy(opt.id);
                    setSortMenuOpen(false);
                    onRefresh?.();
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs rounded-lg flex items-center justify-between ${
                    sortBy === opt.id ? 'bg-[#F3F3F1] font-semibold' : 'hover:bg-[#F8F8F7]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {sortBy === opt.id && <span className="text-[10px] uppercase">{sortDir}</span>}
                </button>
              ))}
              <div className="border-t border-[#E6E6E3] mt-1 pt-1 flex gap-1">
                <button
                  type="button"
                  onClick={() => setSortDir('asc')}
                  className={`flex-1 py-1 text-[11px] rounded ${
                    sortDir === 'asc' ? 'bg-[#191918] text-white' : 'hover:bg-[#F3F3F1]'
                  }`}
                >
                  Ascending
                </button>
                <button
                  type="button"
                  onClick={() => setSortDir('desc')}
                  className={`flex-1 py-1 text-[11px] rounded ${
                    sortDir === 'desc' ? 'bg-[#191918] text-white' : 'hover:bg-[#F3F3F1]'
                  }`}
                >
                  Descending
                </button>
              </div>
            </div>
          )}
        </div>

        {/* View Mode Selector */}
        <div className="relative">
          <button
            data-testid="view-mode-button"
            type="button"
            onClick={() => {
              setViewMenuOpen((v) => !v);
              setSortMenuOpen(false);
            }}
            className="px-3 py-1.5 rounded-lg border border-[#E6E6E3] bg-white hover:bg-[#F3F3F1] text-xs font-medium flex items-center gap-1.5 capitalize"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#6B6B68]" />
            <span>{viewMode}</span>
          </button>

          {viewMenuOpen && (
            <div
              data-testid="view-mode-popover"
              className="absolute right-0 mt-1.5 w-64 rounded-2xl bg-white border border-[#E6E6E3] shadow-xl p-3 z-30 space-y-3"
            >
              <div>
                <div className="text-[11px] font-semibold text-[#6B6B68] uppercase tracking-wider mb-1.5">
                  Layout
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {viewOptions.map((vo) => {
                    const Icon = vo.icon;
                    return (
                      <button
                        key={vo.id}
                        data-testid={`view-option-${vo.id}`}
                        type="button"
                        onClick={() => setViewMode(vo.id)}
                        className={`px-2.5 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 ${
                          viewMode === vo.id
                            ? 'border-[#191918] bg-[#F8F8F7]'
                            : 'border-[#E6E6E3] hover:bg-[#F8F8F7]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{vo.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-[#6B6B68] uppercase tracking-wider mb-1.5">
                  Thumbnail size
                </div>
                <div className="grid grid-cols-3 gap-1 bg-[#F3F3F1] p-1 rounded-xl">
                  {(['sm', 'md', 'lg'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setThumbnailSize(sz)}
                      className={`py-1 text-xs rounded-lg font-medium uppercase ${
                        thumbnailSize === sz ? 'bg-white shadow-sm text-[#191918]' : 'text-[#6B6B68]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-semibold text-[#6B6B68] uppercase tracking-wider mb-1.5">
                  Card details
                </div>
                <div className="space-y-1.5 text-xs">
                  {(
                    [
                      ['showDescription', 'Description snippet'],
                      ['showTags', 'Tags'],
                      ['showDate', 'Timestamp'],
                      ['showKind', 'Type badge'],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between cursor-pointer py-0.5">
                      <span className="text-[#191918]">{label}</span>
                      <input
                        type="checkbox"
                        checked={cardDetails[key]}
                        onChange={(e) =>
                          setCardDetails((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                        }
                        className="rounded border-[#E6E6E3]"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ResourceGrid({
  resources: resourcesProp,
  items,
  title,
  onMutate,
  isTrashView = false,
}: {
  resources?: ResourceItem[];
  items?: ResourceItem[];
  title?: string;
  onMutate?: () => void;
  isTrashView?: boolean;
}) {
  const {
    workspaceSlug,
    viewMode,
    thumbnailSize,
    cardDetails,
    sortBy,
    sortDir,
    openExpandedResource,
    refreshWorkspace,
  } = useWorkspace();

  const rawList = resourcesProp ?? items ?? [];
  const resources = [...rawList].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortBy === 'name') return a.name.localeCompare(b.name) * dir;
    if (sortBy === 'size') return ((a.size || 0) - (b.size || 0)) * dir;
    if (sortBy === 'createdAt') {
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    }
    return (new Date(a.modifiedAt).getTime() - new Date(b.modifiedAt).getTime()) * dir;
  });

  async function handleTogglePin(e: React.MouseEvent, r: ResourceItem) {
    e.stopPropagation();
    await fetch(`/api/resources/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: !r.isPinned }),
    });
    onMutate?.();
  }

  async function handleMoveToTrash(e: React.MouseEvent, r: ResourceItem) {
    e.stopPropagation();
    await fetch(`/api/resources/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trashed: !isTrashView }),
    });
    onMutate?.();
    await refreshWorkspace();
  }

  async function handlePermanentDelete(e: React.MouseEvent, r: ResourceItem) {
    e.stopPropagation();
    await fetch(`/api/resources/${r.id}`, { method: 'DELETE' });
    onMutate?.();
    await refreshWorkspace();
  }

  if (resources.length === 0) {
    return (
      <div className="space-y-4">
        {title && (
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#191918]">{title}</h2>
            <ResourceViewToolbar itemCount={0} onRefresh={onMutate} />
          </div>
        )}
        <div
          data-testid="empty-resource-state"
          className="rounded-2xl border border-dashed border-[#E6E6E3] bg-white/70 p-12 text-center"
        >
          <FileText className="w-8 h-8 text-[#9B9B97] mx-auto mb-2" />
          <div className="text-sm font-medium text-[#191918]">No resources match this view</div>
          <p className="text-xs text-[#6B6B68] mt-1">
            Use the + button in the bottom bar to create a Note, Canvas, Voice Note, or Link.
          </p>
        </div>
      </div>
    );
  }

  if (viewMode === 'list' || viewMode === 'compact') {
    return (
      <div className="space-y-4">
        {title && (
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#191918]">{title}</h2>
            <ResourceViewToolbar itemCount={resources.length} onRefresh={onMutate} />
          </div>
        )}
        <div
          data-testid={`resource-view-${viewMode}`}
          className="bg-white border border-[#E6E6E3] rounded-2xl divide-y divide-[#E6E6E3] overflow-hidden"
        >
        {resources.map((r) => {
          const badge = getResourceKindBadge(r.kind, r.extension);
          const Icon = badge.icon;
          return (
            <div
              key={r.id}
              data-testid={`resource-card-${r.id}`}
              onClick={() => {
                if (r.kind === 'folder') {
                  window.location.href = `/${workspaceSlug}/spaces/${r.id}`;
                } else {
                  openExpandedResource(r.id);
                }
              }}
              className={`flex items-center justify-between gap-4 px-4 ${
                viewMode === 'compact' ? 'py-2' : 'py-3.5'
              } hover:bg-[#F8F8F7] cursor-pointer transition`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#F3F3F1] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#191918]" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#191918] truncate flex items-center gap-2">
                    <span>{r.name}</span>
                    {cardDetails.showKind && (
                      <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${badge.color}`}>
                        {badge.label}
                      </span>
                    )}
                  </div>
                  {viewMode === 'list' && cardDetails.showDescription && r.description && (
                    <div className="text-xs text-[#6B6B68] truncate">{r.description}</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {cardDetails.showTags && r.tags && r.tags.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1">
                    {r.tags.slice(0, 2).map((rt) => (
                      <span
                        key={rt.id}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F3F3F1] text-[#191918] flex items-center gap-1"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: rt.tag.color }}
                        />
                        {rt.tag.name}
                      </span>
                    ))}
                  </div>
                )}

                {cardDetails.showDate && (
                  <span className="text-[11px] text-[#9B9B97] hidden md:inline">
                    {new Date(r.modifiedAt).toLocaleDateString()}
                  </span>
                )}

                <button
                  type="button"
                  title={isTrashView ? 'Restore' : 'Move to trash'}
                  onClick={(e) => handleMoveToTrash(e, r)}
                  className="p-1.5 rounded-lg hover:bg-[#E6E6E3]/60 text-[#6B6B68]"
                >
                  {isTrashView ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}
        </div>
      </div>
    );
  }

  const gridCols =
    thumbnailSize === 'sm'
      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
      : thumbnailSize === 'lg'
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#191918]">{title}</h2>
          <ResourceViewToolbar itemCount={resources.length} onRefresh={onMutate} />
        </div>
      )}
      <div data-testid={`resource-view-${viewMode}`} className={`grid ${gridCols} gap-4`}>
      {resources.map((r) => {
        const badge = getResourceKindBadge(r.kind, r.extension);
        const Icon = badge.icon;
        const previewImg = r.thumbnail || r.cover || (r.kind === 'image' ? r.url : null);

        if (r.kind === 'folder') {
          return (
            <Link
              key={r.id}
              data-testid={`space-card-${r.id}`}
              href={`/${workspaceSlug}/spaces/${r.id}`}
              className="group rounded-2xl bg-white border border-[#E6E6E3] hover:border-[#9B9B97] overflow-hidden shadow-xs transition flex flex-col"
            >
              <div className="h-28 bg-gradient-to-br from-slate-800 to-slate-600 relative overflow-hidden">
                {previewImg && (
                  <img
                    src={previewImg}
                    alt={r.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                )}
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs">
                  SPACE
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="font-semibold text-sm text-[#191918]">{r.name}</div>
                  {r.description && (
                    <p className="text-xs text-[#6B6B68] line-clamp-2 mt-1">{r.description}</p>
                  )}
                </div>
                <div className="mt-3 text-[11px] text-[#9B9B97]">
                  {r._count?.children ?? 0} items
                </div>
              </div>
            </Link>
          );
        }

        return (
          <div
            key={r.id}
            data-testid={`resource-card-${r.id}`}
            onClick={() => openExpandedResource(r.id)}
            className="group rounded-2xl bg-white border border-[#E6E6E3] hover:border-[#9B9B97] overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div>
              {/* Visual Preview Area */}
              <div
                className={`${
                  thumbnailSize === 'sm' ? 'h-28' : thumbnailSize === 'lg' ? 'h-48' : 'h-36'
                } bg-[#F3F3F1] relative overflow-hidden border-b border-[#E6E6E3] flex flex-col justify-between p-3`}
              >
                {previewImg ? (
                  <img
                    src={previewImg}
                    alt={r.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : r.kind === 'notepad' ? (
                  <div className="text-[11px] text-[#6B6B68] line-clamp-5 font-sans leading-relaxed">
                    {(r.content || r.description || '').replace(/[#>*`]/g, '')}
                  </div>
                ) : r.kind === 'audio' || r.kind === 'voice_note' ? (
                  <div className="my-auto flex items-end justify-center gap-1 h-14 px-2">
                    {[35, 65, 45, 80, 95, 50, 70, 85, 40, 60, 90, 55, 45, 75, 60, 35].map((h, idx) => (
                      <div
                        key={idx}
                        className="w-1.5 rounded-full bg-[#45BAF9]"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="m-auto flex flex-col items-center justify-center text-[#9B9B97]">
                    <Icon className="w-8 h-8 stroke-[1.5]" />
                  </div>
                )}

                <div className="relative z-10 flex items-center justify-between w-full">
                  {cardDetails.showKind ? (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide shadow-2xs ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition bg-white/90 backdrop-blur-xs rounded-lg p-0.5 shadow-xs">
                    <button
                      type="button"
                      title="Pin resource"
                      onClick={(e) => handleTogglePin(e, r)}
                      className={`p-1 rounded hover:bg-[#F3F3F1] ${
                        r.isPinned ? 'text-[#2563EB]' : 'text-[#6B6B68]'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title={isTrashView ? 'Restore' : 'Move to trash'}
                      onClick={(e) => handleMoveToTrash(e, r)}
                      className="p-1 rounded hover:bg-[#F3F3F1] text-[#6B6B68]"
                    >
                      {isTrashView ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                    {isTrashView && (
                      <button
                        type="button"
                        title="Delete permanently"
                        onClick={(e) => handlePermanentDelete(e, r)}
                        className="p-1 rounded hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-3.5">
                <div className="font-medium text-sm text-[#191918] line-clamp-1">{r.name}</div>
                {cardDetails.showDescription && r.description && (
                  <p className="text-xs text-[#6B6B68] line-clamp-2 mt-1">{r.description}</p>
                )}
              </div>
            </div>

            {/* Card Footer */}
            <div className="px-3.5 pb-3 pt-1 flex items-center justify-between gap-2 text-[11px] text-[#9B9B97]">
              <div className="flex items-center gap-1.5 truncate">
                {cardDetails.showTags &&
                  r.tags?.slice(0, 2).map((rt) => (
                    <span
                      key={rt.id}
                      className="px-2 py-0.5 rounded-full bg-[#F3F3F1] text-[#191918] text-[10px] font-medium flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: rt.tag.color }} />
                      {rt.tag.name}
                    </span>
                  ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {(r.comments?.length || r._count?.comments || 0) > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[#6B6B68]">
                    <MessageSquare className="w-3 h-3" />
                    <span>{r.comments?.length || r._count?.comments}</span>
                  </span>
                )}
                {r.isShared && <Share2 className="w-3 h-3 text-emerald-600" />}
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
