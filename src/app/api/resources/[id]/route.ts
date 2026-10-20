import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: {
      tags: { include: { tag: true } },
      comments: {
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
      parent: { select: { id: true, name: true, kind: true } },
      children: {
        where: { deletedAt: null },
        include: { tags: { include: { tag: true } } },
        orderBy: { modifiedAt: 'desc' },
      },
    },
  });

  if (!resource) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  }

  return NextResponse.json({ resource });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role === 'Viewer') {
    return NextResponse.json({ error: 'Viewers have read-only access.' }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await req.json();

  const existing = await prisma.resource.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  }

  const updateData: Record<string, unknown> = {};
  if (typeof body.name === 'string') updateData.name = body.name.trim() || existing.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.content !== undefined) {
    updateData.content = body.content;
    updateData.size = Buffer.byteLength(String(body.content || ''), 'utf8');
  }
  if (body.data !== undefined) {
    updateData.data = typeof body.data === 'object' ? JSON.stringify(body.data) : body.data;
  }
  if (body.cover !== undefined) updateData.cover = body.cover;
  if (body.icon !== undefined) updateData.icon = body.icon;
  if (body.parentId !== undefined) updateData.parentId = body.parentId;
  if (body.root !== undefined) updateData.root = body.root;
  if (typeof body.isPinned === 'boolean') updateData.isPinned = body.isPinned;
  if (typeof body.isLocked === 'boolean') updateData.isLocked = body.isLocked;
  if (typeof body.isPasswordProtected === 'boolean') updateData.isPasswordProtected = body.isPasswordProtected;
  if (typeof body.sharePermission === 'string') updateData.sharePermission = body.sharePermission;
  if (typeof body.isShared === 'boolean') {
    updateData.isShared = body.isShared;
    if (body.isShared && !existing.shareToken) {
      updateData.shareToken = crypto.randomBytes(8).toString('hex');
    }
  }
  if (body.trashed === true) {
    updateData.deletedAt = new Date();
  } else if (body.trashed === false) {
    updateData.deletedAt = null;
  }

  if (Array.isArray(body.tagIds)) {
    await prisma.resourceTag.deleteMany({ where: { resourceId: id } });
    for (const tagId of body.tagIds) {
      await prisma.resourceTag.create({
        data: { resourceId: id, tagId },
      });
    }
  }

  const updated = await prisma.resource.update({
    where: { id },
    data: updateData,
    include: {
      tags: { include: { tag: true } },
      comments: {
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
      parent: { select: { id: true, name: true, kind: true } },
    },
  });

  return NextResponse.json({ resource: updated });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role === 'Viewer') {
    return NextResponse.json({ error: 'Viewers have read-only access.' }, { status: 403 });
  }

  const { id } = await context.params;
  await prisma.resource.delete({ where: { id } });

  await recordAuditLog({
    actorId: session.user.id,
    actorEmail: session.user.email,
    action: 'RESOURCE_DELETED_PERMANENT',
    targetType: 'Resource',
    targetId: id,
  });

  return NextResponse.json({ ok: true });
}
