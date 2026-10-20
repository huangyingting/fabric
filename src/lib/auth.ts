import type { NextAuthOptions } from 'next-auth';
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
          if (dbUser.ownedWorkspaces[0]) {
            token.defaultWorkspaceSlug = dbUser.ownedWorkspaces[0].slug;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.defaultWorkspaceSlug = token.defaultWorkspaceSlug;
        session.user.hasFinishedOnboarding = token.hasFinishedOnboarding;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'fabric-super-secret-dev-key-change-in-production-2025',
};
