import { CopilotSdkProvider } from './providers/copilot-sdk';
import { AzureOpenAIProvider } from './providers/azure-openai';
import { AICompletionRequest, AICompletionResponse, AIProvider, AIProviderName } from './types';

export * from './types';

const providers: Record<AIProviderName, AIProvider> = {
  'copilot-sdk': new CopilotSdkProvider(),
  'azure-openai': new AzureOpenAIProvider(),
};

export function resolveProviderName(override?: string | null): AIProviderName {
  const candidate = (override || process.env.AI_PROVIDER || 'copilot-sdk').trim().toLowerCase();
  if (candidate === 'azure-openai' || candidate === 'azure') {
    return 'azure-openai';
  }
  return 'copilot-sdk';
}

export function getAIProvider(override?: string | null): AIProvider {
  const name = resolveProviderName(override);
  return providers[name];
}

export async function runAICompletion(
  request: AICompletionRequest,
  providerOverride?: string | null
): Promise<AICompletionResponse> {
  const provider = getAIProvider(providerOverride);
  return provider.complete(request);
}

export function suggestAutoRenamedTitle(rawName: string, kind: string, content?: string | null): string {
  const cleaned = rawName.trim();
  const isGeneric =
    !cleaned ||
    cleaned.toLowerCase().startsWith('untitled') ||
    /^(img|dsc|screenshot|file|document|audio|video)[-_0-9]+/i.test(cleaned);

  if (!isGeneric) return cleaned;

  if (content && content.trim().length > 0) {
    const firstHeading = content
      .split('\n')
      .map((l) => l.replace(/^[#>*\-\s]+/, '').trim())
      .find((l) => l.length >= 4 && l.length <= 72);
    if (firstHeading) {
      return firstHeading;
    }
  }

  const dateStamp = new Date().toISOString().slice(0, 10);
  const kindLabel: Record<string, string> = {
    notepad: 'Research Note',
    canvas: 'Spatial Architecture Canvas',
    voice_note: 'Voice Memo & Transcript',
    link: 'Captured Web Bookmark',
    document: 'Annotated PDF Document',
    image: 'Visual Reference Frame',
    video: 'Video Clip Reference',
    audio: 'Audio Field Recording',
  };

  return `${kindLabel[kind] || 'Workspace Resource'} (${dateStamp})`;
}
