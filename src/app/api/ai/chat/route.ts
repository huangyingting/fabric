import { NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AIPersonality, FABRIC_AI_MODELS, runAICompletion } from '@/lib/ai';

export async function GET(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let workspaceId = searchParams.get('workspaceId') || actor.workspaceId || null;
  const workspaceSlug = searchParams.get('workspaceSlug');
  const resourceId = searchParams.get('resourceId');

  if (!workspaceId && workspaceSlug) {
    const ws = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
    workspaceId = ws?.id || null;
  }

  const threads = await prisma.aiChatThread.findMany({
    where: {
      ...(workspaceId ? { workspaceId } : {}),
      ...(resourceId ? { resourceId } : {}),
    },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      resource: { select: { id: true, name: true, kind: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 30,
  });

  return NextResponse.json({
    threads,
    models: FABRIC_AI_MODELS,
    defaultProvider: process.env.AI_PROVIDER || 'copilot-sdk',
  });
}

export async function POST(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const {
    workspaceId: rawWsId,
    workspaceSlug,
    threadId,
    resourceId,
    prompt: rawPrompt,
    message,
    actionName,
    model = 'auto',
    providerOverride,
    provider,
    webSearch = false,
  } = body;

  const prompt = rawPrompt || message;
  let workspaceId = rawWsId || actor.workspaceId;
  if (!workspaceId && workspaceSlug) {
    const ws = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
    workspaceId = ws?.id;
  }
  if (!workspaceId) {
    const first = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });
    workspaceId = first?.id;
  }

  if (!workspaceId || (!prompt && !actionName)) {
    return NextResponse.json({ error: 'workspaceId and prompt/actionName are required' }, { status: 400 });
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      aiAgents: { where: { isDefault: true }, take: 1 },
    },
  });

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  let configuredProvider = providerOverride || provider;
  if (!configuredProvider && workspace.settings) {
    try {
      const parsed = JSON.parse(workspace.settings);
      configuredProvider = parsed.aiProvider;
    } catch {
      // ignore
    }
  }

  const defaultAgent = workspace.aiAgents[0];
  const assistantName = defaultAgent?.name || 'Rue';
  const personality = ((defaultAgent?.personality || 'balanced') as AIPersonality);

  // Gather focused resource or top workspace resources for grounding
  const focusedResources = resourceId
    ? await prisma.resource.findMany({
        where: { id: resourceId, deletedAt: null },
        select: { id: true, name: true, kind: true, content: true, description: true },
      })
    : await prisma.resource.findMany({
        where: { workspaceId: workspace.id, kind: { not: 'folder' }, deletedAt: null },
        orderBy: { modifiedAt: 'desc' },
        take: 4,
        select: { id: true, name: true, kind: true, content: true, description: true },
      });

  let activeThread = threadId
    ? await prisma.aiChatThread.findUnique({
        where: { id: threadId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
    : null;

  const userPromptText = prompt || `Run AI Action: ${actionName}`;

  if (!activeThread) {
    activeThread = await prisma.aiChatThread.create({
      data: {
        workspaceId: workspace.id,
        agentId: defaultAgent?.id || null,
        resourceId: resourceId || null,
        title: userPromptText.slice(0, 60),
        model,
        provider: configuredProvider || process.env.AI_PROVIDER || 'copilot-sdk',
      },
      include: { messages: true },
    });
  }

  await prisma.aiChatMessage.create({
    data: {
      threadId: activeThread.id,
      role: 'user',
      content: userPromptText,
      model,
    },
  });

  const historyMessages = [
    ...activeThread.messages.map((m) => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userPromptText },
  ];

  const completion = await runAICompletion(
    {
      messages: historyMessages,
      model,
      personality,
      actionName,
      webSearch,
      workspaceContext: {
        workspaceName: workspace.name,
        assistantName,
        focusedResources,
      },
    },
    configuredProvider
  );

  const assistantMessage = await prisma.aiChatMessage.create({
    data: {
      threadId: activeThread.id,
      role: 'assistant',
      content: completion.content,
      citations: JSON.stringify(completion.citations),
      model: completion.model,
      provider: completion.provider,
    },
  });

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { aiCreditsUsed: { increment: 5 } },
  });

  const updatedThread = await prisma.aiChatThread.findUnique({
    where: { id: activeThread.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      resource: { select: { id: true, name: true, kind: true } },
    },
  });

  return NextResponse.json({
    threadId: updatedThread?.id,
    thread: updatedThread,
    message: assistantMessage,
    completion,
  });
}

export async function DELETE(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'thread id required' }, { status: 400 });
  }

  await prisma.aiChatThread.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
