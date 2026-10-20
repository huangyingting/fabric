import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const resourceId = searchParams.get('resourceId');
  if (!resourceId) {
    return NextResponse.json({ comments: [] });
  }

  const comments = await prisma.comment.findMany({
    where: { resourceId },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json({ comments });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { resourceId, text, timestamp, page, pinX, pinY } = body;

  if (!resourceId || !text || !String(text).trim()) {
    return NextResponse.json({ error: 'resourceId and comment text are required' }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      resourceId,
      authorId: session.user.id,
      body: String(text).trim(),
      timestamp: typeof timestamp === 'number' ? timestamp : null,
      page: typeof page === 'number' ? page : null,
      pinX: typeof pinX === 'number' ? pinX : null,
      pinY: typeof pinY === 'number' ? pinY : null,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Comment id required' }, { status: 400 });
  }

  await prisma.comment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
