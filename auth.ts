import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma, isDemoMode } from '@/lib/prisma';

const demoUsers = [
  { id: 'demo-manager', name: 'مهدی اکبری', email: 'manager@demo.local', role: 'AGENCY_MANAGER' as const, agencyId: 'demo-agency' },
  { id: 'demo-agent', name: 'مشاور نمونه', email: 'agent@demo.local', role: 'AGENT' as const, agencyId: 'demo-agency' },
];

async function verifyPassword(password: string, hash?: string | null) {
  // Until a password-hashing dependency is added, production login only accepts
  // records explicitly stored with the development "plain:" prefix.
  // Replace this with bcrypt/argon2 before public deployment.
  return Boolean(hash?.startsWith('plain:') && hash.slice(6) === password);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      name: 'ورود به خانه‌یار',
      credentials: {
        email: { label: 'ایمیل', type: 'email' },
        password: { label: 'رمز عبور', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').trim().toLowerCase();
        const password = String(credentials?.password ?? '');
        if (!email || !password) return null;

        if (isDemoMode) {
          const user = demoUsers.find(item => item.email === email);
          if (!user || password !== 'demo1234') return null;
          return user;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await verifyPassword(password, user.passwordHash))) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role, agencyId: user.agencyId };
      },
    }),
  ],
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
});
