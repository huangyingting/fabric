import crypto from 'node:crypto';
import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { recordAuditLog } from './audit';
import { ensureUserWorkspace } from './workspace-provisioning';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/signin',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required.');
        }

        const email = credentials.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            passwordCredential: true,
            ownedWorkspaces: {
              orderBy: { createdAt: 'asc' },
              take: 1,
            },
          },
        });

        if (!user || !user.passwordCredential) {
          await recordAuditLog({
            actorEmail: email,
            action: 'USER_LOGIN_FAILED',
            targetType: 'User',
            metadata: { reason: 'User not found or missing password credential' },
          });
          throw new Error('Invalid email or password.');
        }

        if (user.revokedAt) {
          await recordAuditLog({
            actorId: user.id,
            actorEmail: user.email,
            action: 'USER_LOGIN_BLOCKED_REVOKED',
            targetType: 'User',
            targetId: user.id,
            metadata: { revokedAt: user.revokedAt.toISOString() },
          });
          throw new Error('Your account access has been revoked by an administrator.');
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordCredential.passwordHash);
        if (!valid) {
          await recordAuditLog({
            actorId: user.id,
            actorEmail: user.email,
            action: 'USER_LOGIN_FAILED',
            targetType: 'User',
            targetId: user.id,
            metadata: { reason: 'Invalid password' },
          });
          throw new Error('Invalid email or password.');
        }

        let workspace = user.ownedWorkspaces[0];
        if (!workspace) {
          workspace = await ensureUserWorkspace(user.id, user.name, user.email);
        }

        await recordAuditLog({
          actorId: user.id,
          actorEmail: user.email,
          action: 'USER_LOGIN_SUCCESS',
          targetType: 'User',
          targetId: user.id,
          metadata: { role: user.role, workspaceSlug: workspace.slug },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          defaultWorkspaceSlug: workspace.slug,
          hasFinishedOnboarding: user.hasFinishedOnboarding,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.defaultWorkspaceSlug = user.defaultWorkspaceSlug;
        token.hasFinishedOnboarding = user.hasFinishedOnboarding;
      }

      if (trigger === 'update' && session) {
        if (typeof session.hasFinishedOnboarding === 'boolean') {
          token.hasFinishedOnboarding = session.hasFinishedOnboarding;
        }
        if (session.defaultWorkspaceSlug) {
          token.defaultWorkspaceSlug = session.defaultWorkspaceSlug;
        }
        if (session.name) {
          token.name = session.name;
        }
        if (session.role) {
          token.role = session.role;
        }
      }

      // Refresh critical fields from DB if token.id exists
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: {
            ownedWorkspaces: {
              orderBy: { createdAt: 'asc' },
              take: 1,
            },
          },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.hasFinishedOnboarding = dbUser.hasFinishedOnboarding;
          token.revoked = Boolean(dbUser.revokedAt);
          if (dbUser.ownedWorkspaces[0]) {
            token.defaultWorkspaceSlug = dbUser.ownedWorkspaces[0].slug;
          }
        } else {
          token.revoked = true;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.revoked ? '' : token.id;
        session.user.role = token.role;
        session.user.defaultWorkspaceSlug = token.defaultWorkspaceSlug;
        session.user.hasFinishedOnboarding = token.hasFinishedOnboarding;
        session.user.revoked = Boolean(token.revoked);
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'fabric-super-secret-dev-key-change-in-production-2025',
};

export interface AuthenticatedActor {
  id: string;
  email: string;
  name: string | null;
  role: string;
  defaultWorkspaceSlug?: string;
  workspaceId?: string;
  authType: 'session' | 'api-key';
}

export async function getRequestActor(req?: Request): Promise<AuthenticatedActor | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.id && !session.user.revoked) {
    return {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.name || null,
      role: session.user.role || 'Editor',
      defaultWorkspaceSlug: session.user.defaultWorkspaceSlug,
      authType: 'session',
    };
  }

  if (req) {
    const authHeader = req.headers.get('authorization') || '';
    const apiKeyHeader = req.headers.get('x-api-key') || '';
    const rawToken = authHeader.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7).trim()
      : apiKeyHeader.trim();

    if (rawToken && rawToken.startsWith('fbrc_')) {
      const keyHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: {
          user: true,
          workspace: true,
        },
      });
      if (apiKey && !apiKey.user.revokedAt) {
        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() },
        });
        return {
          id: apiKey.user.id,
          email: apiKey.user.email,
          name: apiKey.user.name,
          role: apiKey.user.role,
          defaultWorkspaceSlug: apiKey.workspace.slug,
          workspaceId: apiKey.workspaceId,
          authType: 'api-key',
        };
      }
    }
  }

  return null;
}
