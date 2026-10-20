import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const { searchParams } = new URL(req.url);
  const providedPassword =
    searchParams.get('password') || req.headers.get('x-share-password') || '';

  const resource = await prisma.resource.findFirst({
    where: {
      OR: [{ shareToken: token }, { id: token }],
      isShared: true,
      deletedAt: null,
    },
    include: {
      workspace: { select: { name: true, slug: true } },
      createdBy: { select: { name: true, email: true } },
      tags: { include: { tag: true } },
      comments: {
        include: { author: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!resource) {
    return NextResponse.json(
      { error: 'Shared resource not found or sharing has been disabled.' },
      { status: 404 }
    );
  }

  if (resource.isPasswordProtected) {
    const expected = resource.sharePassword || 'fabric2025';
    if (!providedPassword || providedPassword !== expected) {
      return NextResponse.json(
        {
          locked: true,
          name: resource.name,
          kind: resource.kind,
          workspaceName: resource.workspace.name,
        },
        { status: 401 }
      );
    }
  }

  return NextResponse.json({
    locked: false,
    resource: {
      id: resource.id,
      name: resource.name,
      kind: resource.kind,
      description: resource.description,
      content: resource.content,
      data: resource.data,
      url: resource.url,
      thumbnail: resource.thumbnail,
      cover: resource.cover,
      sharePermission: resource.sharePermission,
      modifiedAt: resource.modifiedAt,
      workspace: resource.workspace,
      createdBy: resource.createdBy,
      tags: resource.tags,
      comments: resource.comments,
    },
  });
}
