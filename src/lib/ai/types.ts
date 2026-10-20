export type AIProviderName = 'copilot-sdk' | 'azure-openai';

export type AIPersonality = 'balanced' | 'warm' | 'direct' | 'concise' | 'sassy';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface FocusedResourceContext {
  id: string;
  name: string;
  kind: string;
  content?: string | null;
  description?: string | null;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  model?: string;
  personality?: AIPersonality;
  actionName?: string;
  webSearch?: boolean;
  workspaceContext?: {
    workspaceName: string;
    assistantName: string;
    focusedResources?: FocusedResourceContext[];
  };
}

export interface AICitation {
  resourceId: string;
  resourceName: string;
  kind: string;
  snippet: string;
}

export interface AICompletionResponse {
  content: string;
  provider: AIProviderName;
  model: string;
  citations: AICitation[];
}

export interface AIProvider {
  readonly name: AIProviderName;
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
}

export const FABRIC_AI_MODELS = [
  { id: 'auto', name: 'Auto', badge: 'Default', description: 'Selects the best model for each task' },
  { id: 'gpt-6-sol', name: 'GPT-6 Sol', badge: 'Pro', description: 'Deep reasoning and multimodal synthesis' },
  { id: 'gpt-5.6-terra', name: 'GPT-5.6 Terra', badge: 'Pro', description: 'Balanced speed and analytical precision' },
  { id: 'gpt-5.6-luna', name: 'GPT-5.6 Luna', badge: 'Pro', description: 'Creative writing and nuanced tone' },
  { id: 'gemini-4-argon', name: 'Gemini 4 Argon', badge: 'Pro', description: 'Long-context document and PDF comprehension' },
  { id: 'grok-4.7', name: 'Grok 4.7', badge: 'Pro', description: 'Direct, real-time synthesis' },
];

export const PERSONALITY_PROMPTS: Record<AIPersonality, string> = {
  balanced: 'Communicate with a clear, thoughtful, well-structured, and balanced tone.',
  warm: 'Communicate with an encouraging, empathetic, warm, and collaborative tone.',
  direct: 'Communicate directly and candidly—lead with the answer and skip unnecessary preamble.',
  concise: 'Be ultra-concise. Use crisp bullet points and short sentences.',
  sassy: 'Be witty, clever, and playfully sharp while still delivering accurate insights.',
};

export function buildContextualSynthesis(request: AICompletionRequest, provider: AIProviderName): AICompletionResponse {
  const lastUserMsg = [...request.messages].reverse().find((m) => m.role === 'user')?.content || '';
  const assistantName = request.workspaceContext?.assistantName || 'Rue';
  const resources = request.workspaceContext?.focusedResources || [];
  const personality = request.personality || 'balanced';
  const model = request.model || 'auto';

  const citations: AICitation[] = resources.slice(0, 4).map((r) => ({
    resourceId: r.id,
    resourceName: r.name,
    kind: r.kind,
    snippet: (r.content || r.description || `${r.kind} resource in workspace`).slice(0, 140),
  }));

  const primaryResource = resources[0];
  const sourceText = primaryResource
    ? `${primaryResource.name}\n${primaryResource.description || ''}\n${primaryResource.content || ''}`.trim()
    : lastUserMsg;

  const lowerPrompt = (request.actionName || lastUserMsg).toLowerCase();
  let content = '';

  if (lowerPrompt.includes('summarize') || lowerPrompt.includes('summary')) {
    content = `### Executive Summary${primaryResource ? `: ${primaryResource.name}` : ''}

- **Core Focus**: ${primaryResource?.description || 'Unified knowledge synthesis across workspace notes, PDFs, canvases, and media.'}
- **Key Insights**:
  1. ${sourceText.split('\n').find((l) => l.trim().length > 25 && !l.startsWith('#')) || 'Combines structured notes, spatial canvases, and multimodal annotations in one graph.'}
  2. Connects external knowledge sources with contextual AI actions and scheduled agents.
  3. Enables spatial & timestamped collaboration directly on PDFs, images, videos, and audio files.
- **Recommended Next Step**: Review linked resources or run **To-do list** to extract concrete action items.`;
  } else if (lowerPrompt.includes('list points') || lowerPrompt.includes('bullet')) {
    content = `### Key Points${primaryResource ? ` from ${primaryResource.name}` : ''}

- **Unified Resource Model**: Notes, Canvases, PDFs, Audio, Video, Images, and Links coexist in one searchable hierarchy.
- **Contextual Grounding**: ${assistantName} grounds answers directly in ${resources.length > 0 ? resources.map((r) => `\`${r.name}\``).join(', ') : 'your active workspace content'}.
- **Multimodal Annotations**: Pin comments spatially on PDFs/Images/Videos or anchor them to exact timestamps on Audio/Video timelines.
- **Pluggable AI Architecture**: Powered by \`${provider}\` (model: \`${model}\`, persona: \`${personality}\`).`;
  } else if (lowerPrompt.includes('five') || lowerPrompt.includes('eli5')) {
    content = `### Explain Like I'm Five${primaryResource ? `: ${primaryResource.name}` : ''}

Imagine your desk has sticky notes, photo albums, research books, and voice recordings all scattered around. **Fabric** is like a magical smart binder that remembers where everything is, connects ideas that belong together, and gives you a friendly helper named **${assistantName}** who can read everything in seconds and answer your questions!`;
  } else if (lowerPrompt.includes('tidy') || lowerPrompt.includes('format')) {
    content = `### Tidied & Formatted Content

#### Overview
${primaryResource?.description || 'Cleaned and structured workspace note.'}

#### Structured Notes
- Clear section headings applied
- Redundant whitespace removed
- Action items normalized into standard Markdown checkboxes`;
  } else if (lowerPrompt.includes('tweet')) {
    content = `### Draft Social Post

Just organized our entire research workflow in @fabric — combining Transformer papers, spatial canvases, timestamped audio notes, and ${assistantName} AI (${provider}) in one second brain. #AI #SecondBrain #KnowledgeGraph`;
  } else if (lowerPrompt.includes('to-do') || lowerPrompt.includes('todo') || lowerPrompt.includes('action item')) {
    content = `### Actionable To-Do List${primaryResource ? ` (${primaryResource.name})` : ''}

- [ ] Review key findings in **${primaryResource?.name || 'Example space'}**
- [ ] Add spatial annotation pins to reference diagrams and PDFs
- [ ] Tag related items with \`Research\` and \`Architecture\`
- [ ] Schedule a recurring daily digest agent in **Tasks**`;
  } else if (lowerPrompt.includes('email')) {
    content = `### Draft Follow-Up Email

**Subject:** Key takeaways & next steps — ${primaryResource?.name || 'Fabric Workspace Update'}

Hi team,

Here is a quick synthesis of our latest workspace notes and research materials:
- **Primary Resource**: ${primaryResource?.name || 'Workspace Knowledge Graph'}
- **Highlights**: ${primaryResource?.description || 'Consolidated research notes, spatial canvas architecture, and annotated media.'}
- **Next Steps**: Please review the pinned comments and add your feedback before tomorrow's sync.

Best regards,  
Prepared with **${assistantName}**`;
  } else if (lowerPrompt.includes('compact')) {
    content = `**Compact Digest (${primaryResource?.name || 'Workspace'}):** ${
      (primaryResource?.description || sourceText).slice(0, 220)
    } — synthesized by ${assistantName} (${provider}/${model}).`;
  } else {
    const contextNames = resources.map((r) => `**${r.name}** (${r.kind})`).join(', ');
    content = `Here is what I found based on ${contextNames || 'your Fabric workspace'}:

1. **Direct Answer**: Regarding *"${lastUserMsg.slice(0, 120)}"*, your workspace connects ${resources.length || 'multiple'} relevant resources${primaryResource ? `, starting with **${primaryResource.name}**` : ''}.
2. **Contextual Synthesis**: ${
      primaryResource?.content
        ? primaryResource.content.replace(/[#>*`]/g, '').slice(0, 280).trim() + '...'
        : primaryResource?.description || 'Your notes, PDFs, canvases, and media files are indexed for instant semantic recall.'
    }
3. **Provider & Persona**: Generated by **${assistantName}** (\`${personality}\` mode) via pluggable provider \`${provider}\` (\`${model}\`).`;
  }

  return {
    content,
    provider,
    model,
    citations,
  };
}
