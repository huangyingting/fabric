import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getRequestActor } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureUserWorkspace } from '@/lib/workspace-provisioning';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');

  await ensureUserWorkspace(actor.id, actor.name || null, actor.email || '');

  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [{ ownerId: actor.id }, { members: { some: { userId: actor.id } } }],
    },
    orderBy: { createdAt: 'asc' },
  });

  const activeWorkspace =
    (slug ? workspaces.find((w) => w.slug === slug) : null) ||
    workspaces[0] ||
    (await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } }));

  if (!activeWorkspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const [resources, spaces, tags, aiAgents, aiActions, aiTasks, connections, notifications, apiKeys, user] = await Promise.all([
    prisma.resource.findMany({
      where: { workspaceId: activeWorkspace.id, deletedAt: null },
      include: {
        tags: { include: { tag: true } },
        parent: { select: { id: true, name: true, kind: true } },
        _count: { select: { children: { where: { deletedAt: null } }, comments: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { modifiedAt: 'desc' }],
    }),
    prisma.resource.findMany({
      where: { workspaceId: activeWorkspace.id, kind: 'folder', deletedAt: null },
      include: {
        _count: { select: { children: { where: { deletedAt: null } } } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.tag.findMany({
      where: { workspaceId: activeWorkspace.id },
      include: { _count: { select: { resources: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.aiAgent.findMany({
      where: { workspaceId: activeWorkspace.id },
      orderBy: { isDefault: 'desc' },
    }),
    prisma.aiAction.findMany({
      where: { workspaceId: activeWorkspace.id },
      orderBy: [{ isBuiltIn: 'desc' }, { createdAt: 'asc' }],
    }),
    prisma.aiTask.findMany({
      where: { workspaceId: activeWorkspace.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.connection.findMany({
      where: { workspaceId: activeWorkspace.id },
      orderBy: { name: 'asc' },
    }),
    prisma.notification.findMany({
      where: { workspaceId: activeWorkspace.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.apiKey.findMany({
      where: { workspaceId: activeWorkspace.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findUnique({
      where: { id: actor.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hasFinishedOnboarding: true,
        preferences: true,
      },
    }),
  ]);

  return NextResponse.json({
    workspace: activeWorkspace,
    workspaces,
    resources,
    spaces,
    tags,
    aiAgents,
    aiActions,
    aiTasks,
    connections,
    notifications,
    apiKeys,
    user,
  });
}

export async function PATCH(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { workspaceId, workspaceSlug, aiProvider, aiModel, name, planTier, settings, userName, newPassword, agentUpdate, giftCode } = body;

  let resolvedWorkspaceId = workspaceId || actor.workspaceId;
  if (!resolvedWorkspaceId && workspaceSlug) {
    const ws = await prisma.workspace.findUnique({ where: { slug: workspaceSlug } });
    resolvedWorkspaceId = ws?.id;
  }

  if (userName || newPassword) {
    if (userName) {
      await prisma.user.update({
        where: { id: actor.id },
        data: { name: String(userName).trim() },
      });
    }
    if (newPassword && String(newPassword).length >= 8) {
      const passwordHash = await bcrypt.hash(String(newPassword), 10);
      await prisma.passwordCredential.upsert({
        where: { userId: actor.id },
        update: { passwordHash },
        create: { userId: actor.id, passwordHash },
      });
    }
  }

  if (agentUpdate && agentUpdate.id) {
    await prisma.aiAgent.update({
      where: { id: agentUpdate.id },
      data: {
        name: agentUpdate.name,
        personality: agentUpdate.personality,
        color: agentUpdate.color,
        instructions: agentUpdate.instructions,
      },
    });
  }

  if (resolvedWorkspaceId) {
    const existing = await prisma.workspace.findUnique({ where: { id: resolvedWorkspaceId } });
    if (existing) {
      let currentSettings: Record<string, unknown> = {};
      try {
        currentSettings = existing.settings ? JSON.parse(existing.settings) : {};
      } catch {
        currentSettings = {};
      }

      const extraSettings = {
        ...(settings || {}),
        ...(aiProvider ? { aiProvider } : {}),
        ...(aiModel ? { aiModel } : {}),
      };
      const mergedSettings = { ...currentSettings, ...extraSettings };
      const effectivePlan = giftCode ? 'pro' : planTier || existing.planTier;

      const updated = await prisma.workspace.update({
        where: { id: resolvedWorkspaceId },
        data: {
          name: name ?? existing.name,
          planTier: effectivePlan,
          aiCreditsLimit: effectivePlan === 'pro' || effectivePlan === 'max' ? 10000 : existing.aiCreditsLimit,
          storageLimitBytes:
            effectivePlan === 'pro' || effectivePlan === 'max' ? 1073741824 * 100 : existing.storageLimitBytes,
          settings: JSON.stringify(mergedSettings),
        },
      });

      await recordAuditLog({
        actorId: actor.id,
        actorEmail: actor.email,
        action: 'WORKSPACE_UPDATED',
        targetType: 'Workspace',
        targetId: updated.id,
        metadata: { planTier: updated.planTier, settings: mergedSettings },
      });

      return NextResponse.json({ workspace: updated });
    }
  }

  return NextResponse.json({ ok: true });
}
