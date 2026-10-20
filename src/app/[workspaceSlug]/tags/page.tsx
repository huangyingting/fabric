'use client';

import React, { useState } from 'react';
import { Tag as TagIcon, Plus, X } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';
import { ResourceGrid } from '@/components/workspace/ResourceGrid';

export default function TagsPage() {
  const { workspaceSlug, tags, resources, refreshWorkspace } = useWorkspace();
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    if (!newTagName.trim()) return;
    await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceSlug,
        name: newTagName.trim(),
        color: newTagColor,
      }),
    });
    setNewTagName('');
    await refreshWorkspace();
  }

  async function handleDeleteTag(e: React.MouseEvent, tagId: string) {
    e.stopPropagation();
    await fetch(`/api/tags?id=${encodeURIComponent(tagId)}`, {
      method: 'DELETE',
    });
    if (selectedTagId === tagId) setSelectedTagId(null);
    await refreshWorkspace();
  }

  const filteredResources = selectedTagId
    ? resources.filter((r) => r.tags?.some((rt) => rt.tag.id === selectedTagId))
    : resources.filter((r) => r.kind !== 'folder');

  return (
    <div data-testid="tags-page" className="max-w-7xl mx-auto p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#E6E6E3] flex items-center justify-center">
            <TagIcon className="w-4 h-4 text-[#191918]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[#191918]">Tags</h1>
            <p className="text-xs text-[#6B6B68]">Semantic taxonomy across all spaces and captures</p>
          </div>
        </div>

        <form onSubmit={handleCreateTag} className="flex items-center gap-2">
          <input
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            className="w-8 h-8 rounded-lg border border-[#E6E6E3] cursor-pointer"
          />
          <input
            data-testid="new-tag-input"
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name..."
            className="px-3 py-1.5 text-xs rounded-xl border border-[#E6E6E3] bg-white"
          />
          <button
            data-testid="create-tag-btn"
            type="submit"
            className="px-3.5 py-1.5 rounded-xl bg-[#191918] text-white text-xs font-medium flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Tag
          </button>
        </form>
      </div>

      {/* Tag Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedTagId(null)}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${
            selectedTagId === null
              ? 'bg-[#191918] text-white border-[#191918]'
              : 'bg-white border-[#E6E6E3]'
          }`}
        >
          All Tagged Items
        </button>

        {tags.map((tag) => (
          <div
            key={tag.id}
            data-testid={`tag-pill-${tag.name}`}
            onClick={() => setSelectedTagId(tag.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-2 cursor-pointer ${
              selectedTagId === tag.id
                ? 'bg-[#191918] text-white border-[#191918]'
                : 'bg-white border-[#E6E6E3]'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
            <span>#{tag.name}</span>
            {typeof tag._count?.resources === 'number' && (
              <span className="text-[10px] opacity-70">({tag._count.resources})</span>
            )}
            <button
              data-testid={`delete-tag-${tag.name}`}
              type="button"
              onClick={(e) => handleDeleteTag(e, tag.id)}
              className="opacity-60 hover:opacity-100 p-0.5 rounded"
              title={`Delete #${tag.name}`}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <ResourceGrid items={filteredResources} title="Tagged Resources" />
    </div>
  );
}
