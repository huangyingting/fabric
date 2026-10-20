import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ensureUserWorkspace } from '@/lib/workspace-provisioning';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const workspaceType = body.workspaceType || 'personal';
  const workspaceName = body.workspaceName || `${session.user.name || 'Personal'}'s Workspace`;
  const useCases = Array.isArray(body.useCases) ? body.useCases : ['Organize projects', 'Take notes', 'AI research'];
  const assistantName = (body.assistantName || 'Rue').trim() || 'Rue';
  const assistantColor = body.assistantColor || '#45BAF9';
  const assistantShape = Number(body.assistantShape || 12);
  const assistantPersonality = body.assistantPersonality || 'balanced';
  const attribution = body.attribution || 'Search engine';
  const planTier = body.planTier || 'free';

  const workspace = await ensureUserWorkspace(session.user.id, session.user.name || null, session.user.email || '');

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: {
      name: workspaceName,
      type: workspaceType,
      planTier,
    },
  });

  const defaultAgent = await prisma.aiAgent.findFirst({
    where: { workspaceId: workspace.id, isDefault: true },
  });

  if (defaultAgent) {
    await prisma.aiAgent.update({
      where: { id: defaultAgent.id },
      data: {
        name: assistantName,
        color: assistantColor,
        shape: assistantShape,
        personality: assistantPersonality,
      },
    });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      hasFinishedOnboarding: true,
      onboardingData: JSON.stringify({
        workspaceType,
        useCases,
        assistantName,
        assistantColor,
        assistantShape,
        assistantPersonality,
        attribution,
        planTier,
      }),
    },
  });

  await recordAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: 'ONBOARDING_COMPLETED',
    targetType: 'Workspace',
    targetId: workspace.id,
    metadata: { workspaceSlug: workspace.slug, assistantName, assistantPersonality, planTier },
  });

  return NextResponse.json({
    ok: true,
    workspaceSlug: workspace.slug,
    redirectTo: `/${workspace.slug}/get-started`,
  });
}
