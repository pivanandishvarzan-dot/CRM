import type { NextAuthConfig } from 'next-auth';

// Cookie security must follow the actual public auth URL, not NODE_ENV alone.
// CI intentionally runs the production build over http://localhost:3000; forcing
// Secure cookies there prevents Auth.js from persisting its auth/CSRF cookies and
// can stop credentials authorization before the database-backed security logic runs.
const authUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || '';
const secureCookies = authUrl
  ? authUrl.startsWith('https://')
  : process.env.NODE_ENV === 'production';

const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8, updateAge: 60 * 30 },
  pages: { signIn: '/login' },
  useSecureCookies: secureCookies,
  cookies: {
    sessionToken: {
      name: secureCookies ? '__Secure-authjs.session-token' : 'authjs.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: secureCookies,
      },
    },
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.agencyId = user.agencyId ?? null;
        token.sessionVersion = user.sessionVersion ?? 1;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? '');
        session.user.role = token.role ?? 'AGENT';
        session.user.agencyId = token.agencyId ?? null;
        session.user.sessionVersion = token.sessionVersion ?? 1;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
