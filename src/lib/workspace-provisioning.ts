import crypto from 'node:crypto';
import { prisma } from './prisma';

export const BUILT_IN_AI_ACTIONS = [
  {
    name: 'Summarize',
    icon: 'FileText',
    prompt: 'Provide a concise, structured executive summary of the current resource or text, highlighting the core thesis and key takeaways.',
  },
  {
    name: 'List points',
    icon: 'List',
    prompt: 'Extract the most important points from this content as a clean, scannable bulleted list.',
  },
  {
    name: "Explain like I'm five",
    icon: 'Smile',
    prompt: 'Explain the concepts in this document in simple, everyday language that anyone can immediately grasp.',
  },
  {
    name: 'Tidy up formatting',
    icon: 'Wand2',
    prompt: 'Clean up the formatting, structure headings, fix grammar, and organize paragraphs for clarity without losing any meaning.',
  },
  {
    name: 'Tweet',
    icon: 'Share2',
    prompt: 'Draft a punchy, engaging social media post / thread summarizing the most interesting insight from this resource.',
  },
  {
    name: 'To-do list',
    icon: 'CheckSquare',
    prompt: 'Extract all actionable next steps, tasks, and follow-ups as a prioritized Markdown checklist.',
  },
  {
    name: 'Email',
    icon: 'Mail',
    prompt: 'Draft a clear, professional follow-up email sharing the key findings and action items from this resource.',
  },
  {
    name: 'Compact',
    icon: 'Minimize2',
    prompt: 'Condense this text to under 30% of its original length while preserving every critical fact and metric.',
  },
];

export const DEFAULT_CONNECTIONS = [
  { provider: 'google-drive', name: 'Google Drive', category: 'app', description: 'Sync Google Docs, Sheets, Slides, and Drive folders automatically.', status: 'connected', syncedCount: 14 },
  { provider: 'notion', name: 'Notion', category: 'app', description: 'Two-way sync pages, databases, and wikis from Notion workspaces.', status: 'connected', syncedCount: 9 },
  { provider: 'gmail', name: 'Gmail', category: 'app', description: 'Save starred emails, attachments, and newsletters directly to Inbox.', status: 'disconnected', syncedCount: 0 },
  { provider: 'slack', name: 'Slack', category: 'app', description: 'Capture bookmarked Slack messages and shared channel links.', status: 'disconnected', syncedCount: 0 },
  { provider: 'github', name: 'GitHub', category: 'app', description: 'Index repository READMEs, issues, PRs, and architecture docs.', status: 'connected', syncedCount: 22 },
  { provider: 'linear', name: 'Linear', category: 'app', description: 'Connect Linear issues, projects, and engineering roadmaps.', status: 'disconnected', syncedCount: 0 },
  { provider: 'figma', name: 'Figma', category: 'app', description: 'Preview and annotate Figma frames and design system components.', status: 'disconnected', syncedCount: 0 },
  { provider: 'dropbox', name: 'Dropbox', category: 'app', description: 'Mirror cloud files, PDFs, and media assets from Dropbox.', status: 'disconnected', syncedCount: 0 },
  { provider: 'onedrive', name: 'Microsoft OneDrive', category: 'app', description: 'Connect Word, Excel, PowerPoint, and OneDrive folders.', status: 'disconnected', syncedCount: 0 },
  { provider: 'readwise', name: 'Readwise', category: 'app', description: 'Automatically import Kindle, Reader, and article highlights.', status: 'disconnected', syncedCount: 0 },
  { provider: 'twitter', name: 'X / Twitter', category: 'app', description: 'Sync bookmarked posts and threads from X into your Inbox.', status: 'disconnected', syncedCount: 0 },
  { provider: 'raindrop', name: 'Raindrop.io', category: 'app', description: 'Sync web bookmarks, tags, and collections from Raindrop.io.', status: 'disconnected', syncedCount: 0 },
  { provider: 'mcp-filesystem', name: 'Model Context Protocol (MCP)', category: 'mcp', description: 'Connect external MCP tool servers to Rue AI Assistant.', status: 'connected', syncedCount: 3 },
];

export async function ensureUserWorkspace(userId: string, userName: string | null, userEmail: string, preferredSlug?: string) {
  const existing = await prisma.workspace.findFirst({
    where: { ownerId: userId },
    include: { resources: { take: 1 } },
  });
  if (existing) {
    return existing;
  }

  const baseSlug =
    preferredSlug ||
    `${(userName || userEmail.split('@')[0] || 'workspace')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 16)}-${crypto.randomBytes(3).toString('hex')}`;

  const referralCode = crypto.randomBytes(3).toString('hex').toUpperCase();
  const firstName = (userName || userEmail.split('@')[0] || 'user').split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

  const workspace = await prisma.workspace.create({
    data: {
      slug: baseSlug,
      name: `${userName || 'Personal'}'s Workspace`,
      type: 'personal',
      planTier: 'free',
      referralCode,
      ownerId: userId,
      settings: JSON.stringify({
        autoRenameEnabled: true,
        autoTagEnabled: true,
        aiProvider: process.env.AI_PROVIDER || 'copilot-sdk',
        defaultModel: 'auto',
        theme: 'light',
        defaultViewMode: 'grid',
      }),
      members: {
        create: {
          userId,
          role: 'Admin',
        },
      },
    },
  });

  // Create default tags
  const tagDefs = [
    { name: 'Research', color: '#45BAF9' },
    { name: 'AI & ML', color: '#8B5CF6' },
    { name: 'Architecture', color: '#10B981' },
    { name: 'Inspiration', color: '#F59E0B' },
    { name: 'Design', color: '#EC4899' },
    { name: 'Reading List', color: '#3B82F6' },
  ];

  const createdTags = await Promise.all(
    tagDefs.map((t) =>
      prisma.tag.create({
        data: {
          workspaceId: workspace.id,
          name: t.name,
          color: t.color,
        },
      })
    )
  );
  const tagByName = Object.fromEntries(createdTags.map((t) => [t.name, t]));

  // Create Inbox root folder
  await prisma.resource.create({
    data: {
      workspaceId: workspace.id,
      root: 'INBOX',
      kind: 'folder',
      name: 'Inbox',
      description: 'Quick capture staging area for unsorted notes, web clips, and voice memos.',
      mimeType: 'application/vnd.fabric.folder',
      icon: 'Inbox',
      createdById: userId,
    },
  });

  // Create Example Space matching fabric.so
  const exampleSpace = await prisma.resource.create({
    data: {
      workspaceId: workspace.id,
      root: 'SPACE',
      kind: 'folder',
      name: 'Example space',
      description: 'A space with some example content to help you explore Fabric.',
      mimeType: 'application/vnd.fabric.folder',
      cover: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1400&q=80',
      icon: 'FolderKanban',
      createdById: userId,
    },
  });

  // 1. Welcome Note (Rich Notepad)
  const welcomeNote = await prisma.resource.create({
    data: {
      workspaceId: workspace.id,
      parentId: exampleSpace.id,
      root: 'SPACE',
      kind: 'notepad',
      name: 'Welcome to Fabric: a sample space',
      description: 'Your quickstart guide to notes, spaces, multimodal annotations, and Rue AI.',
      mimeType: 'application/vnd.fabric.notepad',
      cover: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80',
      size: 4280,
      content: `# Welcome to Fabric: a sample space

Fabric is your self-organizing AI workspace and second brain. Bring together your **notes**, **PDFs**, **canvases**, **voice notes**, **images**, **videos**, and **connected apps** in one unified place.

## What you can do right here
- **Press \`/\` anywhere in a note** to insert headings, checklists, callouts, code blocks, or invoke **Rue AI** inline.
- **Open any PDF, image, video, or audio file** to drop spatial annotation pins or timestamped comments.
- **Ask Rue (top-right or bottom bar)** to summarize documents, compare research papers, or draft action items using the pluggable **GitHub Copilot SDK** or **Azure OpenAI** provider.

### Quick Onboarding Checklist
- [x] Provision your Personal Workspace
- [x] Customize your AI Assistant (**Rue**)
- [ ] Try the \`/Summarize\` AI action on the Attention Is All You Need paper
- [ ] Create a Spatial Canvas or Voice Note from the **+ Create new** bar`,
      createdById: userId,
      tags: {
        create: [{ tagId: tagByName['Research'].id }, { tagId: tagByName['Architecture'].id }],
      },
    },
  });

  // 2. Memory as Mirror (Quote Note)
  await prisma.resource.create({
    data: {
      workspaceId: workspace.id,
      parentId: exampleSpace.id,
      root: 'SPACE',
      kind: 'notepad',
      name: 'Memory as Mirror',
      description: 'Reflections on associative memory, Vannevar Bush Memex, and personal knowledge graphs.',
      mimeType: 'application/vnd.fabric.notepad',
      size: 2150,
      content: `# Memory as Mirror

> "The human mind does not work by alphabetical or numerical indexing. It operates by association. With one item in its grasp, it snaps instantly to the next that is suggested by the association of thoughts."
> — **Vannevar Bush**, *As We May Think* (1945)

## Key Insights
1. Traditional folder hierarchies force a single taxonomy onto ideas that naturally belong to multiple contexts.
2. Combining **semantic embeddings**, **color-aware visual search**, and **contextual AI agents** turns passive archives into an active thinking partner.`,
      createdById: userId,
      tags: {
        create: [{ tagId: tagByName['Inspiration'].id }, { tagId: tagByName['Reading List'].id }],
      },
    },
  });

  // 3. Attention Is All You Need (PDF Document)
  const pdfResource = await prisma.resource.create({
    data: {
      workspaceId: workspace.id,
      parentId: exampleSpace.id,
      root: 'SPACE',
      kind: 'document',
      name: 'NIPS-2017-attention-is-all-you-need-Paper',
      description: 'Seminal Transformer architecture paper by Vaswani et al. (2017) — 11 pages.',
      mimeType: 'application/pdf',
      extension: 'pdf',
      size: 2215940,
      thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
      content: `Attention Is All You Need (Vaswani et al., NIPS 2017)

Abstract:
The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.

Page 2: Scaled Dot-Product Attention & Multi-Head Attention
Attention(Q, K, V) = softmax(QK^T / sqrt(d_k))V
Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions.

Page 3: Encoder and Decoder Stacks
The encoder is composed of a stack of N = 6 identical layers. Each layer has two sub-layers: a multi-head self-attention mechanism, and a position-wise fully connected feed-forward network.`,
      data: JSON.stringify({
        pageCount: 11,
        authors: 'Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Lukasz Kaiser, Illia Polosukhin',
        year: 2017,
      }),
      createdById: userId,
      tags: {
        create: [{ tagId: tagByName['AI & ML'].id }, { tagId: tagByName['Research'].id }],
      },
    },
  });

  await prisma.comment.create({
    data: {
      resourceId: pdfResource.id,
      authorId: userId,
      body: 'We can use this scaled dot-product attention block as the baseline for our retrieval architecture.',
      page: 1,
      pinX: 46,
      pinY: 34,
    },
  });

  // 4. Video Resource (MP4)
  const videoResource = await prisma.resource.create({
    data: {
      workspaceId: workspace.id,
      parentId: exampleSpace.id,
      root: 'SPACE',
      kind: 'video',
      name: '90598_People sitting down to watch a movie_By_Hans_Peter_Schepp_FHD',
      description: '1080p FHD reference cinematography clip with temporal and spatial frame annotations.',
      mimeType: 'video/mp4',
      extension: 'mp4',
      size: 14820400,
      thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      data: JSON.stringify({
        duration: 15,
        resolution: '1920x1080',
        fps: 24,
      }),
      createdById: userId,
      tags: {
        create: [{ tagId: tagByName['Design'].id }],
      },
    },
  });

  await prisma.comment.create({
    data: {
      resourceId: videoResource.id,
      authorId: userId,
      body: 'Love the warm rim lighting and contrast ratio in this opening shot.',
      timestamp: 3.0,
      pinX: 58,
      pinY: 42,
    },
  });

  // 5. Audio Resource (MP3 Waveform)
  const audioResource = await prisma.resource.create({
    data: {
      workspaceId: workspace.id,
      parentId: exampleSpace.id,
      root: 'SPACE',
      kind: 'audio',
      name: 'Wind in Prairie Birdsong',
      description: 'Ambient field recording (2:24) with waveform markers and transcript.',
      mimeType: 'audio/mpeg',
      extension: 'mp3',
      size: 3420100,
      content: '[00:00] Gentle prairie wind rustling through tall grass.\n[00:42] Meadowlark vocalization in the stereo left channel.\n[01:35] Distant creek ambience and afternoon breeze.',
      data: JSON.stringify({
        duration: 144,
        peaks: [22, 38, 65, 48, 82, 91, 54, 40, 73, 88, 62, 35, 49, 77, 94, 68, 44, 58, 81, 53, 39, 72, 86, 61, 45, 67, 89, 52, 33, 60, 75, 48],
      }),
      createdById: userId,
      tags: {
        create: [{ tagId: tagByName['Inspiration'].id }],
      },
    },
  });

  await prisma.comment.create({
    data: {
      resourceId: audioResource.id,
      authorId: userId,
      body: 'Great stereo separation on the meadowlark call right here.',
      timestamp: 42.0,
    },
  });

  // 6, 7, 8. Sample High-Res Images with Spatial Pins & Color Palettes
  const image1 = await prisma.resource.create({
    data: {
      workspaceId: workspace.id,
      parentId: exampleSpace.id,
      root: 'SPACE',
      kind: 'image',
      name: 'IMG_0024',
      description: 'Minimalist architectural concrete & sunlight study.',
      mimeType: 'image/jpeg',
      extension: 'png',
      size: 1850200,
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
      data: JSON.stringify({
        width: 2400,
        height: 1600,
        colors: ['#E5DFD5', '#2C3539', '#8C7A6B'],
      }),
      createdById: userId,
      tags: {
        create: [{ tagId: tagByName['Design'].id }, { tagId: tagByName['Architecture'].id }],
      },
    },
  });

  await prisma.comment.create({
    data: {
      resourceId: image1.id,
      authorId: userId,
      body: 'Should we crop this right-hand shadow edge for the hero banner?',
      pinX: 68,
      pinY: 38,
    },
  });

  await prisma.resource.create({
    data: {
      workspaceId: workspace.id,
      parentId: exampleSpace.id,
      root: 'SPACE',
      kind: 'image',
      name: 'DTS_AA_by_Daniel_Faro_41',
      description: 'Editorial studio photography reference.',
      mimeType: 'image/jpeg',
      extension: 'jpg',
      size: 1620400,
      url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80',
      data: JSON.stringify({
        width: 2000,
        height: 1500,
        colors: ['#F4EFE6', '#4A4D55', '#C89D7C'],
      }),
      createdById: userId,
      tags: {
        create: [{ tagId: tagByName['Inspiration'].id }],
      },
    },
  });

  await prisma.resource.create({
    data: {
      workspaceId: workspace.id,
      parentId: exampleSpace.id,
      root: 'SPACE',
      kind: 'image',
      name: '16737503507_431768a927',
      description: 'Natural landscape moodboard reference.',
      mimeType: 'image/jpeg',
      extension: 'jpg',
      size: 1940100,
      url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80',
      thumbnail: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80',
      data: JSON.stringify({
        width: 2200,
        height: 1460,
        colors: ['#2E4A3E', '#9AB0A6', '#D9E2DC'],
      }),
      createdById: userId,
    },
  });

  // 9. Sample Spatial Canvas inside Example Space
  await prisma.resource.create({
    data: {
      workspaceId: workspace.id,
      parentId: exampleSpace.id,
      root: 'SPACE',
      kind: 'canvas',
      name: 'Knowledge Graph & System Architecture Canvas',
      description: 'Interactive spatial canvas linking notes, papers, and architecture blocks.',
      mimeType: 'application/vnd.fabric.canvas',
      size: 3840,
      data: JSON.stringify({
        zoom: 1,
        panX: 0,
        panY: 0,
        nodes: [
          {
            id: 'node-1',
            type: 'sticky',
            title: 'Core Thesis',
            content: 'Unify Notes, Canvases, PDFs, Audio, Video, and AI Agents into one spatial graph.',
            x: 80,
            y: 90,
            width: 240,
            height: 150,
            color: '#FEF3C7',
          },
          {
            id: 'node-2',
            type: 'resource',
            title: 'Attention Is All You Need.pdf',
            content: 'Transformer self-attention paper (NIPS 2017)',
            resourceId: pdfResource.id,
            x: 410,
            y: 80,
            width: 260,
            height: 150,
            color: '#DBEAFE',
          },
          {
            id: 'node-3',
            type: 'text',
            title: 'Pluggable AI Layer',
            content: 'Primary: @github/copilot-sdk\nSwitchable: Azure OpenAI (gpt-4o)',
            x: 250,
            y: 300,
            width: 280,
            height: 140,
            color: '#EDE9FE',
          },
        ],
        edges: [
          { id: 'edge-1', from: 'node-1', to: 'node-2', label: 'grounds' },
          { id: 'edge-2', from: 'node-2', to: 'node-3', label: 'powers' },
        ],
      }),
      createdById: userId,
      tags: {
        create: [{ tagId: tagByName['Architecture'].id }, { tagId: tagByName['AI & ML'].id }],
      },
    },
  });

  // Create default AI Assistant `Rue`
  const rueAgent = await prisma.aiAgent.create({
    data: {
      workspaceId: workspace.id,
      name: 'Rue',
      emailAddress: `rue.${firstName || 'user'}@ai.fabric.so`,
      personality: 'balanced',
      color: '#45BAF9',
      shape: 12,
      cheeks: 1,
      instructions: 'You are Rue, the user’s personalized Fabric AI assistant. Synthesize knowledge across notes, PDFs, canvases, and connected apps clearly and accurately.',
      isDefault: true,
    },
  });

  // Create the 8 built-in AI Actions
  for (const action of BUILT_IN_AI_ACTIONS) {
    await prisma.aiAction.create({
      data: {
        workspaceId: workspace.id,
        name: action.name,
        prompt: action.prompt,
        icon: action.icon,
        isBuiltIn: true,
      },
    });
  }

  // Create initial AI Chat thread
  const initialThread = await prisma.aiChatThread.create({
    data: {
      workspaceId: workspace.id,
      agentId: rueAgent.id,
      resourceId: welcomeNote.id,
      title: 'Welcome to Fabric & Rue overview',
      model: 'auto',
      provider: process.env.AI_PROVIDER || 'copilot-sdk',
      messages: {
        create: [
          {
            role: 'assistant',
            content: `Hi ${userName || 'there'}! I'm **Rue**, your Fabric AI assistant. Ask me anything about your workspace, run one of the 8 quick actions (**Summarize**, **List points**, **To-do list**, etc.), or switch between **GitHub Copilot SDK** and **Azure OpenAI** anytime.`,
            model: 'auto',
            provider: process.env.AI_PROVIDER || 'copilot-sdk',
          },
        ],
      },
    },
  });
  void initialThread;

  // Create sample Scheduled AI Agent / Task
  await prisma.aiTask.create({
    data: {
      workspaceId: workspace.id,
      name: 'Daily Research & Reading Digest',
      instructions: 'Scan all recently modified notes, PDFs, and inbox bookmarks in the workspace and compile a concise daily briefing with key insights and action items.',
      frequency: 'daily',
      hour: '09:00',
      accessScope: 'all',
      personality: 'balanced',
      emailEnabled: true,
      status: 'active',
      lastRunAt: new Date(Date.now() - 3600 * 1000 * 4),
      lastResultSummary: 'Synthesized 3 research items (Attention Is All You Need, Memory as Mirror, and Welcome to Fabric) into key architectural takeaways.',
    },
  });

  // Create Connections
  for (const conn of DEFAULT_CONNECTIONS) {
    await prisma.connection.create({
      data: {
        workspaceId: workspace.id,
        provider: conn.provider,
        name: conn.name,
        category: conn.category,
        description: conn.description,
        status: conn.status,
        syncedCount: conn.syncedCount,
        lastSyncedAt: conn.status === 'connected' ? new Date() : null,
      },
    });
  }

  // Create Welcome Notification
  await prisma.notification.create({
    data: {
      workspaceId: workspace.id,
      userId,
      title: 'Welcome to Fabric Workspace',
      body: 'Your personal workspace, Example space, and Rue AI assistant are ready to explore.',
      type: 'welcome',
      linkUrl: `/${workspace.slug}/get-started`,
    },
  });

  return workspace;
}
