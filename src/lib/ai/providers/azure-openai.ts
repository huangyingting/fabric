import {
  AICompletionRequest,
  AICompletionResponse,
  AIProvider,
  PERSONALITY_PROMPTS,
  buildContextualSynthesis,
} from '../types';

export class AzureOpenAIProvider implements AIProvider {
  public readonly name = 'azure-openai' as const;

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, '');
    const apiKey = process.env.AZURE_OPENAI_API_KEY || '';
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';
    const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-10-21';

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

    const systemMessage = [
      `You are ${assistantName}, the AI assistant inside Fabric Workspace (${request.workspaceContext?.workspaceName || 'Personal Workspace'}).`,
      PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.balanced,
      contextBlock ? `Grounded Workspace Context:\n${contextBlock}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    if (endpoint && apiKey && !endpoint.includes('your-resource.openai.azure.com')) {
      try {
        const url = `${endpoint}/openai/deployments/${encodeURIComponent(
          deployment
        )}/chat/completions?api-version=${encodeURIComponent(apiVersion)}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': apiKey,
          },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: systemMessage },
              ...request.messages,
            ],
            temperature: 0.4,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const reply = data?.choices?.[0]?.message?.content;
          if (reply && typeof reply === 'string') {
            return {
              content: reply.trim(),
              provider: 'azure-openai',
              model: deployment,
              citations: resources.slice(0, 4).map((r) => ({
                resourceId: r.id,
                resourceName: r.name,
                kind: r.kind,
                snippet: (r.content || r.description || r.name).slice(0, 140),
              })),
            };
          }
        }
      } catch (err) {
        console.warn('[AzureOpenAIProvider] Falling back to local synthesis:', err);
      }
    }

    return buildContextualSynthesis(
      {
        ...request,
        model: request.model && request.model !== 'auto' ? request.model : deployment,
      },
      'azure-openai'
    );
  }
}
