'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UploadCloud, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useWorkspace } from '@/components/workspace/WorkspaceContext';

export default function MarketplaceImportPage() {
  const { workspaceSlug, createQuickResource, refreshWorkspace, openExpandedResource } = useWorkspace();
  const [importedName, setImportedName] = useState<string | null>(null);

  return (
    <div data-testid="marketplace-import-page" className="max-w-4xl mx-auto p-6 sm:p-8 space-y-6">
      <Link
        href={`/${workspaceSlug}/marketplace`}
        className="inline-flex items-center gap-1 text-xs text-[#6B6B68] hover:text-[#191918]"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Marketplace
      </Link>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white border border-[#E6E6E3] flex items-center justify-center">
          <UploadCloud className="w-5 h-5 text-[#191918]" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#191918]">Import from External Apps & Files</h1>
          <p className="text-xs text-[#6B6B68]">Migrate notes, markdown vaults, bookmarks, and documents in one click</p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-[#E6E6E3] space-y-3">
        <div className="text-sm font-semibold">Upload Local Vault File (.md, .txt, .json, .csv, .pdf)</div>
        <input
          data-testid="marketplace-import-file-input"
          type="file"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const fd = new FormData();
            fd.append('workspaceSlug', workspaceSlug);
            fd.append('title', f.name);
            fd.append('file', f);
            const res = await fetch('/api/uploads', { method: 'POST', body: fd });
            if (res.ok) {
              const data = await res.json();
              setImportedName(f.name);
              await refreshWorkspace();
              if (data.resource?.id) openExpandedResource(data.resource.id);
            }
          }}
          className="w-full text-xs text-[#6B6B68] file:mr-3 file:px-3.5 file:py-1.5 file:rounded-xl file:border-0 file:bg-[#191918] file:text-white file:text-xs file:font-medium"
        />
        {importedName && (
          <div className="text-xs text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Imported {importedName} into your workspace.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {['Notion', 'Obsidian', 'Evernote', 'Raindrop.io', 'Readwise', 'Apple Notes'].map((app) => (
          <div key={app} className="p-5 rounded-2xl bg-white border border-[#E6E6E3] flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">{app}</div>
              <div className="text-xs text-[#6B6B68]">Preserve hierarchy, tags, and attachments</div>
            </div>
            <button
              type="button"
              onClick={() =>
                createQuickResource({
                  kind: 'notepad',
                  name: `${app} Imported Knowledge`,
                  content: `# ${app} Import\n\nAll notes and metadata imported into Fabric.`,
                  openAfterCreate: true,
                })
              }
              className="px-3.5 py-1.5 rounded-xl bg-[#191918] text-white text-xs font-medium"
            >
              Import
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
