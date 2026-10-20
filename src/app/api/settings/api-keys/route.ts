import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get('workspaceId');

  const apiKeys = await prisma.apiKey.findMany({
    where: workspaceId ? { workspaceId } : { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ apiKeys, keys: apiKeys });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role === 'Viewer') {
    return NextResponse.json({ error: 'Viewers have read-only access.' }, { status: 403 });
  }

  const body = await req.json();
  const { workspaceId: rawWsId, name } = body;

  let workspaceId = rawWsId;
  if (!workspaceId) {
    const first = await prisma.workspace.findFirst({ orderBy: { createdAt: 'asc' } });
    workspaceId = first?.id;
  }

  if (!workspaceId || !name) {
    return NextResponse.json({ error: 'workspaceId and name are required' }, { status: 400 });
  }

  const rawSecret = `fbrc_live_${crypto.randomBytes(18).toString('hex')}`;
  const keyPrefix = rawSecret.slice(0, 16) + '...';
  const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');

  const apiKey = await prisma.apiKey.create({
    data: {
      workspaceId,
      userId: session.user.id,
      name: String(name).trim(),
      keyPrefix,
      keyHash,
    },
  });

  await recordAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: 'API_KEY_CREATED',
    targetType: 'ApiKey',
    targetId: apiKey.id,
    metadata: { name: apiKey.name, keyPrefix },
  });

  return NextResponse.json({ apiKey, rawSecret, rawKey: rawSecret }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'API key id required' }, { status: 400 });
  }

  await prisma.apiKey.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
