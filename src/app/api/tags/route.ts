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

  const tags = await prisma.tag.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    include: {
      _count: { select: { resources: true } },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({ tags });
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
  const { workspaceId: rawWsId, workspaceSlug, name, color = '#45BAF9' } = body;

  let workspaceId = rawWsId || actor.workspaceId;
  if (!workspaceId && workspaceSlug) {
    const ws = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
    workspaceId = ws?.id;
  }
  if (!workspaceId) {
    const first = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });
    workspaceId = first?.id;
  }

  if (!workspaceId || !name || !String(name).trim()) {
    return NextResponse.json({ error: 'workspaceId and tag name are required' }, { status: 400 });
  }

  const tag = await prisma.tag.upsert({
    where: {
      workspaceId_name: {
        workspaceId,
        name: String(name).trim(),
      },
    },
    update: { color },
    create: {
      workspaceId,
      name: String(name).trim(),
      color,
    },
    include: {
      _count: { select: { resources: true } },
    },
  });

  return NextResponse.json({ tag }, { status: 201 });
}

export async function DELETE(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (actor.role === 'Viewer') {
    return NextResponse.json({ error: 'Viewers have read-only access.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Tag id required' }, { status: 400 });
  }

  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
