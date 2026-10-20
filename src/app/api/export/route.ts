import { NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

export async function GET(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workspaceSlug = searchParams.get('workspaceSlug');
  const format = (searchParams.get('format') || 'json').toLowerCase();

  const workspace = workspaceSlug
    ? await prisma.workspace.findUnique({ where: { slug: workspaceSlug } })
    : actor.workspaceId
    ? await prisma.workspace.findUnique({ where: { id: actor.workspaceId } })
    : await prisma.workspace.findFirst({ where: { ownerId: actor.id } });

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const [resources, tags, aiTasks] = await Promise.all([
    prisma.resource.findMany({
      where: { workspaceId: workspace.id, deletedAt: null },
      include: {
        tags: { include: { tag: true } },
        comments: {
          include: { author: { select: { name: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
        parent: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.tag.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { name: 'asc' },
    }),
    prisma.aiTask.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  await recordAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'WORKSPACE_EXPORTED',
    targetType: 'Workspace',
    targetId: workspace.id,
    metadata: { format, resourceCount: resources.length },
  });

  if (format === 'markdown' || format === 'md') {
    const sections = [
      `# Fabric Workspace Export: ${workspace.name}`,
      `- **Slug**: \`${workspace.slug}\``,
      `- **Exported At**: ${new Date().toISOString()}`,
      `- **Resources**: ${resources.length}`,
      `- **Tags**: ${tags.map((t) => `#${t.name}`).join(', ') || 'None'}`,
      '',
      '---',
      '',
    ];

    for (const r of resources) {
      const tagStr = r.tags.map((rt) => `#${rt.tag.name}`).join(' ');
      sections.push(`## [${r.kind.toUpperCase()}] ${r.name}`);
      if (r.parent?.name) sections.push(`- **Space**: ${r.parent.name}`);
      if (r.url) sections.push(`- **URL**: ${r.url}`);
      if (tagStr) sections.push(`- **Tags**: ${tagStr}`);
      if (r.description) sections.push(`\n*${r.description}*`);
      if (r.content) sections.push(`\n${r.content}`);
      if (r.comments.length > 0) {
        sections.push('\n### Annotations & Comments');
        for (const c of r.comments) {
          sections.push(
            `- **${c.author?.name || c.author?.email}**: ${c.body}${
              c.resolved ? ' *(Resolved)*' : ''
            }`
          );
        }
      }
      sections.push('\n---\n');
    }

    const mdContent = sections.join('\n');
    return new NextResponse(mdContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${workspace.slug}-export.md"`,
      },
    });
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    workspace: {
      id: workspace.id,
      slug: workspace.slug,
      name: workspace.name,
      planTier: workspace.planTier,
    },
    stats: {
      totalResources: resources.length,
      totalTags: tags.length,
      totalScheduledTasks: aiTasks.length,
    },
    tags,
    aiTasks,
    resources,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${workspace.slug}-export.json"`,
    },
  });
}
