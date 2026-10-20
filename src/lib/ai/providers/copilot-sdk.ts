import { CopilotClient } from '@github/copilot-sdk';
import {
  AICompletionRequest,
  AICompletionResponse,
  AIProvider,
  PERSONALITY_PROMPTS,
  buildContextualSynthesis,
} from '../types';

export class CopilotSdkProvider implements AIProvider {
  public readonly name = 'copilot-sdk' as const;

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const requestedModel =
      !request.model || request.model === 'auto'
        ? process.env.COPILOT_MODEL || 'gpt-5.6-sol'
        : request.model;

    const assistantName = request.workspaceContext?.assistantName || 'Rue';
    const personality = request.personality || 'balanced';
    const resources = request.workspaceContext?.focusedResources || [];

    const contextBlock = resources
      .map(
        (r, idx) =>
          `[Resource ${idx + 1}: ${r.name} (${r.kind})]\nDescription: ${r.description || 'N/A'}\nContent:\n${(
            r.content || ''
          ).slice(0, 1500)}`
      )
      .join('\n\n');

    const systemPrompt = [
      `You are ${assistantName}, the AI assistant inside Fabric Workspace (${request.workspaceContext?.workspaceName || 'Personal Workspace'}).`,
      PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.balanced,
      contextBlock ? `Grounded Workspace Context:\n${contextBlock}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    const userConversation = request.messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    const fullPrompt = `${systemPrompt}\n\n${userConversation}`;

    // Attempt live @github/copilot-sdk session when enabled and CLI is available
    if (process.env.COPILOT_SDK_LIVE === 'true') {
      let client: CopilotClient | null = null;
      try {
        client = new CopilotClient();
        await Promise.race([
          client.start(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Copilot SDK start timeout')), 4500)),
        ]);

        const session = await client.createSession({
          model: requestedModel,
          onPermissionRequest: async () => ({ kind: 'approved' as const }),
        });

        let assistantReply = '';
        const done = new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('Copilot SDK session timeout')), 8000);
          session.on('assistant.message', (event) => {
            if (event?.data?.content) {
              assistantReply += event.data.content;
            }
          });
          session.on('session.idle', () => {
            clearTimeout(timer);
            resolve();
          });
        });

        await session.send({ prompt: fullPrompt });
        await done;
        await session.disconnect();
        await client.stop();

        if (assistantReply.trim()) {
          return {
            content: assistantReply.trim(),
            provider: 'copilot-sdk',
            model: requestedModel,
            citations: resources.slice(0, 4).map((r) => ({
              resourceId: r.id,
              resourceName: r.name,
              kind: r.kind,
              snippet: (r.content || r.description || r.name).slice(0, 140),
            })),
          };
        }
      } catch {
        if (client) {
          try {
            await client.stop();
          } catch {
            // ignore cleanup errors
          }
        }
      }
    }

    // Resilient contextual synthesis powered by the CopilotSdkProvider adapter
    return buildContextualSynthesis(
      {
        ...request,
        model: requestedModel,
      },
      'copilot-sdk'
    );
  }
}
