import { NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AIPersonality, runAICompletion } from '@/lib/ai';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId') || actor.workspaceId;

  const tasks = await prisma.aiTask.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ tasks });
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
    workspaceId: rawWsId,
    workspaceSlug,
    action,
    taskId,
    name: rawName,
    title,
    instructions: rawInstructions,
    prompt,
    frequency = 'daily',
    day = 'Monday',
    hour: rawHour,
    timeOfDay,
    accessScope = 'all',
    personality = 'balanced',
    emailEnabled = false,
    status = 'active',
  } = body;

  if (action === 'run_now' && taskId) {
    const existing = await prisma.aiTask.findUnique({ where: { id: taskId } });
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    const workspace = await prisma.workspace.findUnique({ where: { id: existing.workspaceId } });
    const resources = await prisma.resource.findMany({
      where: { workspaceId: existing.workspaceId, kind: { not: 'folder' }, deletedAt: null },
      orderBy: { modifiedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, kind: true, content: true, description: true },
    });

    const completion = await runAICompletion({
      messages: [{ role: 'user', content: existing.instructions }],
      personality: (existing.personality as AIPersonality) || 'balanced',
      workspaceContext: {
        workspaceName: workspace?.name || 'Workspace',
        assistantName: existing.name,
        focusedResources: resources,
      },
    });

    const reportNote = await prisma.resource.create({
      data: {
        workspaceId: existing.workspaceId,
        root: 'INBOX',
        kind: 'notepad',
        name: `[Agent Report] ${existing.name} — ${new Date().toISOString().slice(0, 10)}`,
        description: `Automated agent execution output (${completion.provider}/${completion.model}).`,
        mimeType: 'application/vnd.fabric.notepad',
        size: Buffer.byteLength(completion.content, 'utf8'),
        content: `# ${existing.name}\n\n*Executed at ${new Date().toLocaleString()} via \`${completion.provider}\`*\n\n${completion.content}`,
        createdById: actor.id,
      },
    });

    const updated = await prisma.aiTask.update({
      where: { id: taskId },
      data: {
        lastRunAt: new Date(),
        lastResultSummary: completion.content.slice(0, 260),
        lastResultResourceId: reportNote.id,
      },
    });

    await recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'AI_TASK_EXECUTED',
      targetType: 'AiTask',
      targetId: updated.id,
      metadata: { reportResourceId: reportNote.id, provider: completion.provider },
    });

    return NextResponse.json({
      task: updated,
      reportResource: reportNote,
      output: completion.content,
    });
  }

  let workspaceId = rawWsId;
  if (!workspaceId && workspaceSlug) {
    const ws = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
    workspaceId = ws?.id;
  }
  if (!workspaceId) {
    const first = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });
    workspaceId = first?.id;
  }

  const name = rawName || title;
  const instructions = rawInstructions || prompt;
  const hour = rawHour || timeOfDay || '09:00';

  if (!workspaceId || !name || !instructions) {
    return NextResponse.json({ error: 'workspaceId, name, and instructions are required' }, { status: 400 });
  }

  const task = await prisma.aiTask.create({
    data: {
      workspaceId,
      name: String(name).trim(),
      instructions: String(instructions).trim(),
      frequency,
      day,
      hour,
      accessScope,
      personality,
      emailEnabled: Boolean(emailEnabled),
      status,
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}

export async function PATCH(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (actor.role === 'Viewer') {
    return NextResponse.json({ error: 'Viewers have read-only access.' }, { status: 403 });
  }

  const body = await req.json();
  const { id, status, runNow } = body;

  if (!id) {
    return NextResponse.json({ error: 'Task id required' }, { status: 400 });
  }

  const existing = await prisma.aiTask.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (runNow) {
    const workspace = await prisma.workspace.findUnique({ where: { id: existing.workspaceId } });
    const resources = await prisma.resource.findMany({
      where: { workspaceId: existing.workspaceId, kind: { not: 'folder' }, deletedAt: null },
      orderBy: { modifiedAt: 'desc' },
      take: 5,
      select: { id: true, name: true, kind: true, content: true, description: true },
    });

    const completion = await runAICompletion({
      messages: [{ role: 'user', content: existing.instructions }],
      personality: (existing.personality as AIPersonality) || 'balanced',
      workspaceContext: {
        workspaceName: workspace?.name || 'Workspace',
        assistantName: existing.name,
        focusedResources: resources,
      },
    });

    const reportNote = await prisma.resource.create({
      data: {
        workspaceId: existing.workspaceId,
        root: 'INBOX',
        kind: 'notepad',
        name: `[Agent Report] ${existing.name} — ${new Date().toISOString().slice(0, 10)}`,
        description: `Automated agent execution output (${completion.provider}/${completion.model}).`,
        mimeType: 'application/vnd.fabric.notepad',
        size: Buffer.byteLength(completion.content, 'utf8'),
        content: `# ${existing.name}\n\n*Executed at ${new Date().toLocaleString()} via \`${completion.provider}\`*\n\n${completion.content}`,
        createdById: actor.id,
      },
    });

    const updated = await prisma.aiTask.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
        lastResultSummary: completion.content.slice(0, 260),
        lastResultResourceId: reportNote.id,
      },
    });

    await recordAuditLog({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'AI_TASK_EXECUTED',
      targetType: 'AiTask',
      targetId: updated.id,
      metadata: { reportResourceId: reportNote.id, provider: completion.provider },
    });

    return NextResponse.json({ task: updated, reportResource: reportNote });
  }

  const updated = await prisma.aiTask.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
    },
  });

  return NextResponse.json({ task: updated });
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
    return NextResponse.json({ error: 'Task id required' }, { status: 400 });
  }

  await prisma.aiTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
