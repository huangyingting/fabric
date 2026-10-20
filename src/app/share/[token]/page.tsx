'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, ExternalLink, Sparkles, Tag, MessageSquare, FileText } from 'lucide-react';

interface SharedResourceData {
  id: string;
  name: string;
  kind: string;
  description: string | null;
  content: string | null;
  data: string | null;
  url: string | null;
  thumbnail: string | null;
  cover: string | null;
  modifiedAt: string;
  workspace: { name: string; slug: string };
  createdBy: { name: string | null; email: string };
  tags: Array<{ tag: { id: string; name: string; color: string } }>;
  comments: Array<{ id: string; body: string; createdAt: string; author: { name: string | null; email: string } }>;
}

export default function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [lockedMeta, setLockedMeta] = useState<{ name?: string; workspaceName?: string }>({});
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resource, setResource] = useState<SharedResourceData | null>(null);

  async function loadShared(pwd?: string) {
    setLoading(true);
    setError(null);
    try {
      const qs = pwd ? `?password=${encodeURIComponent(pwd)}` : '';
      const res = await fetch(`/api/share/${encodeURIComponent(token)}${qs}`);
      const data = await res.json();
      if (res.status === 401 && data.locked) {
        setLocked(true);
        setLockedMeta({ name: data.name, workspaceName: data.workspaceName });
        if (pwd) setError('Incorrect share password.');
      } else if (!res.ok) {
        setError(data.error || 'Shared resource not found.');
      } else {
        setLocked(false);
        setResource(data.resource);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShared();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F7] flex items-center justify-center text-sm text-[#6B6B68]">
        Loading shared Fabric resource...
      </div>
    );
  }

  if (locked) {
    return (
      <div
        data-testid="share-password-gate"
        className="min-h-screen bg-[#F8F8F7] flex items-center justify-center p-4"
      >
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E6E6E3] p-8 shadow-sm space-y-5">
          <div className="w-10 h-10 rounded-xl bg-[#191918] text-white flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#6B6B68]">
              Password Protected Resource
            </div>
            <h1 className="text-xl font-bold text-[#191918] mt-1">
              {lockedMeta.name || 'Shared Resource'}
            </h1>
            <p className="text-xs text-[#6B6B68] mt-1">
              Enter the passcode provided by {lockedMeta.workspaceName || 'the workspace owner'} to view this resource.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadShared(password);
            }}
            className="space-y-3"
          >
            <input
              data-testid="share-password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter share passcode..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#E6E6E3] bg-[#F8F8F7]"
            />
            <button
              data-testid="share-unlock-btn"
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#191918] text-white text-xs font-semibold"
            >
              Unlock Resource
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-[#F8F8F7] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="text-lg font-semibold text-[#191918]">{error || 'Resource not found'}</div>
        <Link href="/signin" className="px-4 py-2 rounded-xl bg-[#191918] text-white text-xs font-medium">
          Sign in to Fabric
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="public-share-viewer" className="min-h-screen bg-[#F8F8F7] flex flex-col">
      <header className="h-14 px-6 bg-white border-b border-[#E6E6E3] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#191918] text-white flex items-center justify-center font-bold text-xs">
            F
          </div>
          <div className="text-xs">
            <span className="font-semibold text-[#191918]">{resource.workspace.name}</span>
            <span className="text-[#6B6B68]"> · Shared by {resource.createdBy.name || resource.createdBy.email}</span>
          </div>
        </div>
        <Link
          href="/signin"
          className="px-3.5 py-1.5 rounded-xl bg-[#191918] text-white text-xs font-medium flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#45BAF9]" />
          <span>Open in Fabric</span>
        </Link>
      </header>

      <main className="max-w-4xl w-full mx-auto flex-1 p-6 sm:p-10 space-y-6">
        <div className="bg-white rounded-2xl border border-[#E6E6E3] overflow-hidden shadow-xs">
          {resource.cover && (
            <div className="h-52 w-full overflow-hidden">
              <img src={resource.cover} alt={resource.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-8 space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6B68]">
              <span className="px-2.5 py-0.5 rounded-full bg-[#F3F3F1] font-semibold uppercase text-[10px] text-[#191918]">
                {resource.kind}
              </span>
              <span>•</span>
              <span>Updated {new Date(resource.modifiedAt).toLocaleDateString()}</span>
              {resource.tags.map((rt) => (
                <span
                  key={rt.tag.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F8F8F7] border border-[#E6E6E3] text-[11px]"
                >
                  <Tag className="w-3 h-3" />
                  {rt.tag.name}
                </span>
              ))}
            </div>

            <h1 data-testid="shared-resource-title" className="text-3xl font-bold text-[#191918]">
              {resource.name}
            </h1>

            {resource.description && (
              <p className="text-sm text-[#6B6B68]">{resource.description}</p>
            )}

            {resource.url && resource.kind === 'link' && (
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

            {resource.kind === 'image' && (resource.url || resource.thumbnail) && (
              <div className="rounded-xl overflow-hidden border border-[#E6E6E3] bg-black flex justify-center">
                <img
                  src={resource.url || resource.thumbnail || ''}
                  alt={resource.name}
                  className="max-h-[520px] object-contain"
                />
              </div>
            )}

            {resource.content && (
              <div
                data-testid="shared-resource-content"
                className="pt-4 border-t border-[#E6E6E3] prose prose-sm max-w-none whitespace-pre-line text-sm leading-relaxed text-[#191918]"
              >
                {resource.content}
              </div>
            )}

            {!resource.content && resource.kind !== 'image' && (
              <div className="pt-4 border-t border-[#E6E6E3] flex items-center gap-2 text-xs text-[#6B6B68]">
                <FileText className="w-4 h-4" />
                <span>Shared multimodal resource ready for inspection.</span>
              </div>
            )}
          </div>
        </div>

        {resource.comments.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E6E6E3] p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6B6B68]">
              <MessageSquare className="w-4 h-4" />
              <span>Annotations & Comments ({resource.comments.length})</span>
            </div>
            <div className="divide-y divide-[#E6E6E3]">
              {resource.comments.map((c) => (
                <div key={c.id} className="py-3 text-xs space-y-1">
                  <div className="font-semibold text-[#191918]">
                    {c.author.name || c.author.email}
                  </div>
                  <div className="text-[#6B6B68]">{c.body}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
