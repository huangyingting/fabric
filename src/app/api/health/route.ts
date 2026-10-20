import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveProviderName } from '@/lib/ai';

export async function GET() {
  const startedAt = Date.now();
  try {
    const userCount = await prisma.user.count();
    const workspaceCount = await prisma.workspace.count();
    const activeProvider = resolveProviderName();

    return NextResponse.json({
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      latencyMs: Date.now() - startedAt,
      database: {
        connected: true,
        provider: (process.env.DATABASE_URL || '').startsWith('postgres') ? 'postgresql' : 'sqlite',
        users: userCount,
        workspaces: workspaceCount,
      },
      ai: {
        activeProvider,
        supportedProviders: ['copilot-sdk', 'azure-openai'],
      },
      security: {
        admissionMode: process.env.ACCOUNT_ADMISSION_MODE || 'invitation-only',
        rbacRoles: ['Admin', 'Editor', 'Viewer'],
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database connectivity check failed';
    return NextResponse.json(
      {
        status: 'degraded',
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
