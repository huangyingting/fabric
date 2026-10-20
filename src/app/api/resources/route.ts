import { NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { suggestAutoRenamedTitle } from '@/lib/ai';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceSlug = searchParams.get('workspaceSlug');
  const parentId = searchParams.get('parentId');
  const root = searchParams.get('root');
  const kind = searchParams.get('kind');
  const tagId = searchParams.get('tagId');
  const search = searchParams.get('search');
  const color = searchParams.get('color');
  const trashed = searchParams.get('trashed') === 'true';
  const shared = searchParams.get('shared') === 'true';
  const sortBy = searchParams.get('sortBy') || 'modifiedAt';
  const sortDir = (searchParams.get('sortDir') === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

  const workspace = workspaceSlug
    ? await prisma.workspace.findUnique({ where: { slug: workspaceSlug } })
    : actor.workspaceId
    ? await prisma.workspace.findUnique({ where: { id: actor.workspaceId } })
    : await prisma.workspace.findFirst({ where: { ownerId: actor.id } });

  if (!workspace) {
    return NextResponse.json({ resources: [] });
  }

  const whereClause: Record<string, unknown> = {
    workspaceId: workspace.id,
    deletedAt: trashed ? { not: null } : null,
  };

  if (parentId === 'null') {
    whereClause.parentId = null;
  } else if (parentId) {
    whereClause.parentId = parentId;
  }

  if (root) {
    whereClause.root = root;
  }

  if (kind) {
    whereClause.kind = kind;
  } else if (!parentId && !trashed && !search && !tagId && !shared && root !== 'INBOX') {
    // By default in Home / Timeline, return non-folder items unless kind=folder is requested
    whereClause.kind = { not: 'folder' };
  }

  if (shared) {
    whereClause.isShared = true;
  }

  if (tagId) {
    whereClause.tags = { some: { tagId } };
  }

  if (search && search.trim()) {
    const q = search.trim();
    whereClause.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { content: { contains: q } },
      { url: { contains: q } },
    ];
  }

  if (color && color.trim()) {
    whereClause.data = { contains: color.trim() };
  }

  const validSortField = ['name', 'createdAt', 'modifiedAt', 'size', 'kind'].includes(sortBy)
    ? sortBy
    : 'modifiedAt';

  const resources = await prisma.resource.findMany({
    where: whereClause,
    include: {
      tags: { include: { tag: true } },
      comments: {
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
      parent: { select: { id: true, name: true, kind: true } },
      _count: { select: { children: { where: { deletedAt: null } }, comments: true } },
    },
    orderBy: { [validSortField]: sortDir },
  });

  return NextResponse.json({ resources });
}

export async function POST(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (actor.role === 'Viewer') {
    return NextResponse.json({ error: 'Viewers have read-only access.' }, { status: 403 });
  }

  const body = await req.json();
  const {
    workspaceId,
    workspaceSlug,
    parentId,
    root = 'SPACE',
    kind = 'notepad',
    name,
    description,
    url,
    content,
    data,
    cover,
    icon,
    tagIds,
    isShared = false,
  } = body;

  const workspace = workspaceId
    ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
    : workspaceSlug
    ? await prisma.workspace.findUnique({ where: { slug: workspaceSlug } })
    : actor.workspaceId
    ? await prisma.workspace.findUnique({ where: { id: actor.workspaceId } })
    : await prisma.workspace.findFirst({ where: { ownerId: actor.id } });

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  let autoRenameEnabled = true;
  try {
    const parsed = workspace.settings ? JSON.parse(workspace.settings) : {};
    if (typeof parsed.autoRenameEnabled === 'boolean') {
      autoRenameEnabled = parsed.autoRenameEnabled;
    }
  } catch {
    // default true
  }

  const rawName = (name || '').trim() || (kind === 'folder' ? 'New space' : `Untitled ${kind}`);
  const finalName =
    autoRenameEnabled && kind !== 'folder' ? suggestAutoRenamedTitle(rawName, kind, content) : rawName;

  const mimeMap: Record<string, string> = {
    folder: 'application/vnd.fabric.folder',
    notepad: 'application/vnd.fabric.notepad',
    canvas: 'application/vnd.fabric.canvas',
    link: 'application/vnd.fabric.bookmark',
    voice_note: 'audio/webm',
    audio: 'audio/mpeg',
    video: 'video/mp4',
    document: 'application/pdf',
    image: 'image/jpeg',
  };

  const defaultCanvasData =
    kind === 'canvas' && !data
      ? JSON.stringify({
          zoom: 1,
          panX: 0,
          panY: 0,
          nodes: [
            {
              id: 'node-1',
              type: 'sticky',
              title: 'New Idea',
              content: 'Double-click or add cards from the toolbar below.',
              x: 120,
              y: 120,
              width: 240,
              height: 140,
              color: '#FEF3C7',
            },
          ],
          edges: [],
        })
      : typeof data === 'object' && data !== null
      ? JSON.stringify(data)
      : data || null;

  const created = await prisma.resource.create({
    data: {
      workspaceId: workspace.id,
      parentId: parentId || null,
      root,
      kind,
      name: finalName,
      description: description || null,
      mimeType: mimeMap[kind] || 'application/octet-stream',
      url: url || null,
      originUrl: url || null,
      cover: cover || null,
      icon: icon || null,
      size: content ? Buffer.byteLength(String(content), 'utf8') : 1024,
      content:
        content ??
        (kind === 'notepad'
          ? `# ${finalName}\n\nStart writing, or press \`/\` for commands and AI actions...`
          : kind === 'voice_note'
          ? `[00:00] Voice note recorded in ${workspace.name}.\n[00:08] Action items and transcript automatically generated by Rue.`
          : null),
      data: defaultCanvasData,
      isShared: Boolean(isShared),
      createdById: actor.id,
      tags:
        Array.isArray(tagIds) && tagIds.length > 0
          ? {
              create: tagIds.map((tid: string) => ({ tagId: tid })),
            }
          : undefined,
    },
    include: {
      tags: { include: { tag: true } },
      comments: { include: { author: { select: { id: true, name: true, email: true } } } },
      parent: { select: { id: true, name: true, kind: true } },
    },
  });

  await recordAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'RESOURCE_CREATED',
    targetType: 'Resource',
    targetId: created.id,
    metadata: { kind: created.kind, name: created.name, workspaceId: workspace.id, authType: actor.authType },
  });

  return NextResponse.json({ resource: created }, { status: 201 });
}
