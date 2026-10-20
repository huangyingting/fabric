import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role === 'Viewer') {
    return NextResponse.json({ error: 'Viewers have read-only access.' }, { status: 403 });
  }

  const body = await req.json();
  const { workspaceId, resourceId, action } = body;

  if (resourceId && (action === 'restore' || action === 'purge')) {
    if (action === 'restore') {
      await prisma.resource.update({
        where: { id: resourceId },
        data: { deletedAt: null },
      });
    } else {
      await prisma.resource.delete({ where: { id: resourceId } });
    }
    return NextResponse.json({ ok: true });
  }

  if (!workspaceId) {
    return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
  }

  if (action === 'restore-all') {
    await prisma.resource.updateMany({
      where: { workspaceId, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === 'empty-trash') {
    await prisma.resource.deleteMany({
      where: { workspaceId, deletedAt: { not: null } },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown trash action' }, { status: 400 });
}
