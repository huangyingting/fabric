import NextAuth, { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      defaultWorkspaceSlug: string;
      hasFinishedOnboarding: boolean;
      revoked?: boolean;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    role: string;
    defaultWorkspaceSlug: string;
    hasFinishedOnboarding: boolean;
    revoked?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    defaultWorkspaceSlug: string;
    hasFinishedOnboarding: boolean;
    revoked?: boolean;
  }
}
