import { NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId') || actor.workspaceId;

  const connections = await prisma.connection.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ connections });
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
  const { workspaceId: rawWsId, workspaceSlug, provider, name, action, importSource, importItems } = body;

  let workspaceId = rawWsId || actor.workspaceId;
  if (!workspaceId && workspaceSlug) {
    const ws = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
    workspaceId = ws?.id;
  }
  if (!workspaceId) {
    const first = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });
    workspaceId = first?.id;
  }

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
  }

  if (action === 'import' && importSource) {
    const sampleTitle =
      Array.isArray(importItems) && importItems.length > 0
        ? importItems[0]
        : `Imported from ${importSource} (${new Date().toISOString().slice(0, 10)})`;

    const importedResource = await prisma.resource.create({
      data: {
        workspaceId,
        root: 'INBOX',
        kind: 'notepad',
        name: sampleTitle,
        description: `Imported knowledge collection from ${importSource}.`,
        mimeType: 'application/vnd.fabric.notepad',
        size: 1840,
        content: `# ${sampleTitle}\n\nImported directly via **Fabric Importer (${importSource})**.\n\n- Automatically indexed for semantic search\n- Ready for Rue AI summarization and tagging`,
        createdById: actor.id,
      },
    });

    return NextResponse.json({ importedResource }, { status: 201 });
  }

  if (!provider) {
    return NextResponse.json({ error: 'provider required' }, { status: 400 });
  }

  const existing = await prisma.connection.findUnique({
    where: { workspaceId_provider: { workspaceId, provider } },
  });

  if (existing) {
    const nextStatus = existing.status === 'connected' ? 'disconnected' : 'connected';
    const updated = await prisma.connection.update({
      where: { id: existing.id },
      data: {
        status: nextStatus,
        syncedCount: nextStatus === 'connected' ? Math.max(5, existing.syncedCount || 8) : 0,
        lastSyncedAt: nextStatus === 'connected' ? new Date() : null,
      },
    });
    return NextResponse.json({ connection: updated });
  }

  const created = await prisma.connection.create({
    data: {
      workspaceId,
      provider,
      name: name || provider,
      category: provider.startsWith('mcp') ? 'mcp' : 'app',
      status: 'connected',
      syncedCount: 6,
      lastSyncedAt: new Date(),
    },
  });

  return NextResponse.json({ connection: created }, { status: 201 });
}
