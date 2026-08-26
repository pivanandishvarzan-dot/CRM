import type { NextAuthConfig } from 'next-auth';

const production=process.env.NODE_ENV==='production';
const authConfig = {
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 8, updateAge: 60 * 30 },
  pages: { signIn: '/login' },
  useSecureCookies: production,
  cookies:{sessionToken:{name:production?'__Secure-authjs.session-token':'authjs.session-token',options:{httpOnly:true,sameSite:'lax' as const,path:'/',secure:production}}},
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
