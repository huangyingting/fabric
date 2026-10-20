import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
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
  const { userId, role } = body;
  if (!userId || !['Admin', 'Editor', 'Viewer'].includes(role)) {
    return NextResponse.json({ error: 'Valid userId and role are required.' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, name: true, role: true },
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
