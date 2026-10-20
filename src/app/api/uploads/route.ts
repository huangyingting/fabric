import fs from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

function inferKindFromMimeAndExt(mime: string, ext: string, overrideKind?: string | null): string {
  if (overrideKind && ['document', 'image', 'video', 'audio', 'notepad'].includes(overrideKind)) {
    return overrideKind;
  }
  const m = mime.toLowerCase();
  const e = ext.toLowerCase();
  if (m.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(e)) return 'image';
  if (m.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a', '.webm'].includes(e)) return 'audio';
  if (m.startsWith('video/') || ['.mp4', '.mov', '.mkv'].includes(e)) return 'video';
  if (e === '.md' || e === '.markdown') return 'notepad';
  return 'document';
}

export async function POST(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (actor.role === 'Viewer') {
    return NextResponse.json({ error: 'Viewers have read-only access.' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const workspaceSlug = (formData.get('workspaceSlug') as string | null) || actor.defaultWorkspaceSlug;
    const workspaceId = (formData.get('workspaceId') as string | null) || actor.workspaceId;
    const parentId = (formData.get('parentId') as string | null) || null;
    const root = ((formData.get('root') as string | null) || 'SPACE').toUpperCase();
    const customTitle = (formData.get('title') as string | null) || '';
    const requestedKind = formData.get('kind') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided in multipart form data.' }, { status: 400 });
    }

    const workspace = workspaceId
      ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
      : workspaceSlug
      ? await prisma.workspace.findUnique({ where: { slug: workspaceSlug } })
      : await prisma.workspace.findFirst({ where: { ownerId: actor.id } });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const ext = path.extname(file.name) || '.bin';
    const safeBase = path
      .basename(file.name, ext)
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      .slice(0, 60) || 'asset';
    const storedFileName = `${Date.now()}-${safeBase}${ext}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.writeFile(path.join(uploadsDir, storedFileName), buffer);

    const publicUrl = `/uploads/${storedFileName}`;
    const mimeType = file.type || 'application/octet-stream';
    const kind = inferKindFromMimeAndExt(mimeType, ext, requestedKind);

    let extractedContent: string | null = null;
    const isTextLike =
      mimeType.startsWith('text/') ||
      ['.md', '.txt', '.json', '.csv', '.html', '.ts', '.js', '.py'].includes(ext.toLowerCase());

    if (isTextLike && buffer.byteLength <= 2 * 1024 * 1024) {
      extractedContent = buffer.toString('utf8');
    } else if (kind === 'document') {
      extractedContent = `Uploaded Document: ${customTitle.trim() || file.name}\nFile size: ${buffer.byteLength} bytes (${mimeType})\nStored at: ${publicUrl}\n\nIndexed for full-text search, Rue AI grounding, and spatial page pin annotations.`;
    }

    const resource = await prisma.resource.create({
      data: {
        workspaceId: workspace.id,
        parentId: parentId || null,
        root,
        kind,
        name: customTitle.trim() || file.name,
        description: `Uploaded ${kind} file (${(buffer.byteLength / 1024).toFixed(1)} KB)`,
        mimeType,
        extension: ext.replace(/^\./, ''),
        size: buffer.byteLength,
        url: publicUrl,
        thumbnail: kind === 'image' ? publicUrl : null,
        content: extractedContent,
        createdById: actor.id,
      },
      include: {
        tags: { include: { tag: true } },
        comments: { include: { author: { select: { id: true, name: true, email: true } } } },
        parent: { select: { id: true, name: true, kind: true } },
      },
    });

    await prisma.workspace.update({
      where: { id: workspace.id },
      data: {
        storageUsedBytes: { increment: buffer.byteLength },
      },
    });

    await recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'RESOURCE_UPLOADED',
      targetType: 'Resource',
      targetId: resource.id,
      metadata: {
        fileName: file.name,
        size: buffer.byteLength,
        mimeType,
        kind,
        url: publicUrl,
      },
    });

    return NextResponse.json({ resource, url: publicUrl }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'File upload failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
