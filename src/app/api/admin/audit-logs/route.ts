import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'Admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const actionFilter = searchParams.get('action');

  const logs = await prisma.auditLog.findMany({
    where: actionFilter ? { action: { contains: actionFilter } } : undefined,
    include: {
      actor: { select: { email: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const normalized = logs.map((l) => ({
    ...l,
    entityType: l.targetType || 'System',
    entityId: l.targetId,
    actor: l.actor || (l.actorEmail ? { email: l.actorEmail, name: null, role: 'User' } : null),
  }));

  return NextResponse.json({ logs: normalized });
}
