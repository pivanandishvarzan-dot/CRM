import type { NextAuthConfig } from 'next-auth';

const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 12 },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.agencyId = user.agencyId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? '');
        session.user.role = token.role ?? 'AGENT';
        session.user.agencyId = token.agencyId ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
