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

  const actions = await prisma.aiAction.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: [{ isBuiltIn: 'desc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json({ actions });
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
  const { workspaceId: rawWsId, workspaceSlug, name, prompt, icon = 'Sparkles' } = body;

  let workspaceId = rawWsId || actor.workspaceId;
  if (!workspaceId && workspaceSlug) {
    const ws = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
    workspaceId = ws?.id;
  }
  if (!workspaceId) {
    const first = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });
    workspaceId = first?.id;
  }

  if (!workspaceId || !name || !prompt) {
    return NextResponse.json({ error: 'workspaceId, name, and prompt are required' }, { status: 400 });
  }

  const action = await prisma.aiAction.create({
    data: {
      workspaceId,
      name: String(name).trim(),
      prompt: String(prompt).trim(),
      icon,
      isBuiltIn: false,
    },
  });

  return NextResponse.json({ action }, { status: 201 });
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
    return NextResponse.json({ error: 'Action id is required' }, { status: 400 });
  }

  await prisma.aiAction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
