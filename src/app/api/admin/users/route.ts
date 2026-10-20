import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      revokedAt: true,
      hasFinishedOnboarding: true,
      createdAt: true,
      ownedWorkspaces: {
        select: { id: true, slug: true, name: true, planTier: true },
      },
    },
  });

  return NextResponse.json({ users });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const body = await req.json();
  const { userId, role, action } = body;
  if (!userId) {
    return NextResponse.json({ error: 'userId is required.' }, { status: 400 });
  }

  if (action === 'revoke_user' || action === 'restore_user') {
    if (userId === session.user.id && action === 'revoke_user') {
      return NextResponse.json({ error: 'You cannot revoke your own active admin account.' }, { status: 400 });
    }
    const revokedAt = action === 'revoke_user' ? new Date() : null;
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { revokedAt },
      select: { id: true, email: true, name: true, role: true, revokedAt: true },
    });

    await recordAuditLog({
      actorId: session.user.id,
      actorEmail: session.user.email,
      action: action === 'revoke_user' ? 'USER_REVOKED' : 'USER_RESTORED',
      targetType: 'User',
      targetId: updated.id,
      metadata: { targetEmail: updated.email, revokedAt: updated.revokedAt?.toISOString() || null },
    });

    return NextResponse.json({ user: updated });
  }

  if (!['Admin', 'Editor', 'Viewer'].includes(role)) {
    return NextResponse.json({ error: 'Valid role (Admin, Editor, Viewer) is required.' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, name: true, role: true, revokedAt: true },
  });

  await prisma.workspaceMember.updateMany({
    where: { userId },
    data: { role },
  });

  await recordAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: 'USER_ROLE_CHANGED',
    targetType: 'User',
    targetId: updated.id,
    metadata: { targetEmail: updated.email, newRole: role },
  });

  return NextResponse.json({ user: updated });
}
