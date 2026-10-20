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

  const notifications = await prisma.notification.findMany({
    where: workspaceId ? { workspaceId } : { userId: actor.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({ notifications });
}

export async function PATCH(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { workspaceId: rawWsId, workspaceSlug, id, markAllRead } = body;

  let workspaceId = rawWsId;
  if (!workspaceId && workspaceSlug) {
    const ws = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
    workspaceId = ws?.id;
  }

  if ((markAllRead || !id) && workspaceId) {
    await prisma.notification.updateMany({
      where: { workspaceId },
      data: { isRead: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (id) {
    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return NextResponse.json({ notification: updated });
  }

  return NextResponse.json({ ok: true });
}
