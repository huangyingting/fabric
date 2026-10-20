import { NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (actor.role === 'Viewer') {
    return NextResponse.json({ error: 'Viewers have read-only access.' }, { status: 403 });
  }

  const body = await req.json();
  const { workspaceId: rawWsId, workspaceSlug, resourceId, action } = body;

  if (resourceId && (action === 'restore' || action === 'purge')) {
    if (action === 'restore') {
      await prisma.resource.update({
        where: { id: resourceId },
        data: { deletedAt: null },
      });
    } else {
      await prisma.resource.delete({ where: { id: resourceId } });
    }
    return NextResponse.json({ ok: true });
  }

  let workspaceId = rawWsId || actor.workspaceId;
  if (!workspaceId && workspaceSlug) {
    const ws = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
    workspaceId = ws?.id;
  }

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId or workspaceSlug is required' }, { status: 400 });
  }

  if (action === 'restore-all') {
    const res = await prisma.resource.updateMany({
      where: { workspaceId, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
    await recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'TRASH_RESTORED_ALL',
      targetType: 'Workspace',
      targetId: workspaceId,
      metadata: { count: res.count },
    });
    return NextResponse.json({ ok: true, count: res.count });
  }

  if (action === 'empty-trash') {
    const res = await prisma.resource.deleteMany({
      where: { workspaceId, deletedAt: { not: null } },
    });
    await recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'TRASH_EMPTIED',
      targetType: 'Workspace',
      targetId: workspaceId,
      metadata: { count: res.count },
    });
    return NextResponse.json({ ok: true, count: res.count });
  }

  return NextResponse.json({ error: 'Unknown trash action' }, { status: 400 });
}
