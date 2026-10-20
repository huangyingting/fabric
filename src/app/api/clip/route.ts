import { NextResponse } from 'next/server';
import { getRequestActor } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from '@/lib/audit';

function extractMetaTag(html: string, attrName: string, attrValue: string): string | null {
  const regex1 = new RegExp(
    `<meta[^>]+${attrName}=["']${attrValue}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i'
  );
  const match1 = html.match(regex1);
  if (match1?.[1]) return match1[1].trim();

  const regex2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attrName}=["']${attrValue}["'][^>]*>`,
    'i'
  );
  const match2 = html.match(regex2);
  if (match2?.[1]) return match2[1].trim();
  return null;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function scrapeWebUrl(rawUrl: string): Promise<{
  title: string | null;
  description: string | null;
  image: string | null;
  excerpt: string | null;
}> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const res = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'FabricWebClipper/2.0 (+https://fabric.so)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { title: null, description: null, image: null, excerpt: null };
    }

    const html = (await res.text()).slice(0, 150000);
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const ogTitle = extractMetaTag(html, 'property', 'og:title');
    const description =
      extractMetaTag(html, 'property', 'og:description') ||
      extractMetaTag(html, 'name', 'description');
    const ogImage = extractMetaTag(html, 'property', 'og:image');

    const bodyCleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ');
    const excerpt = decodeHtmlEntities(bodyCleaned).slice(0, 1200);

    return {
      title: ogTitle ? decodeHtmlEntities(ogTitle) : titleMatch?.[1] ? decodeHtmlEntities(titleMatch[1]) : null,
      description: description ? decodeHtmlEntities(description) : null,
      image: ogImage || null,
      excerpt: excerpt || null,
    };
  } catch {
    return { title: null, description: null, image: null, excerpt: null };
  }
}

export async function POST(req: Request) {
  const actor = await getRequestActor(req);
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (actor.role === 'Viewer') {
    return NextResponse.json({ error: 'Viewers have read-only access.' }, { status: 403 });
  }

  const body = await req.json();
  const { url: rawUrl, title: customTitle, workspaceSlug, workspaceId, parentId, root = 'INBOX' } = body;

  if (!rawUrl || !String(rawUrl).trim()) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const normalizedUrl = String(rawUrl).trim().startsWith('http')
    ? String(rawUrl).trim()
    : `https://${String(rawUrl).trim()}`;

  const workspace = workspaceId
    ? await prisma.workspace.findUnique({ where: { id: workspaceId } })
    : workspaceSlug
    ? await prisma.workspace.findUnique({ where: { slug: workspaceSlug } })
    : await prisma.workspace.findFirst({ where: { ownerId: actor.id } });

  if (!workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
  }

  const scraped = await scrapeWebUrl(normalizedUrl);
  let hostname = normalizedUrl;
  try {
    hostname = new URL(normalizedUrl).hostname;
  } catch {
    // keep raw
  }

  const finalTitle =
    (customTitle && String(customTitle).trim()) ||
    scraped.title ||
    normalizedUrl.replace(/^https?:\/\//, '').slice(0, 60);

  const finalDescription =
    scraped.description || `Captured web bookmark from ${hostname}`;

  const finalContent = [
    `# ${finalTitle}`,
    `Source: ${normalizedUrl}`,
    scraped.description ? `\n> ${scraped.description}` : '',
    scraped.excerpt ? `\n## Captured Excerpt\n${scraped.excerpt}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const resource = await prisma.resource.create({
    data: {
      workspaceId: workspace.id,
      parentId: parentId || null,
      root,
      kind: 'link',
      name: finalTitle,
      description: finalDescription,
      mimeType: 'application/vnd.fabric.bookmark',
      url: normalizedUrl,
      originUrl: normalizedUrl,
      thumbnail: scraped.image,
      cover: scraped.image,
      size: Buffer.byteLength(finalContent, 'utf8'),
      content: finalContent,
      createdById: actor.id,
    },
    include: {
      tags: { include: { tag: true } },
      comments: { include: { author: { select: { id: true, name: true, email: true } } } },
      parent: { select: { id: true, name: true, kind: true } },
    },
  });

  await recordAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'WEB_CLIP_CREATED',
    targetType: 'Resource',
    targetId: resource.id,
    metadata: { url: normalizedUrl, title: finalTitle },
  });

  return NextResponse.json({ resource, scraped }, { status: 201 });
}
