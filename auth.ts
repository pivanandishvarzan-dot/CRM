import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma, isDemoMode } from '@/lib/prisma';

const demoUsers = [
  { id: 'demo-manager', name: 'مهدی اکبری', email: 'manager@demo.local', role: 'AGENCY_MANAGER' as const, agencyId: 'demo-agency' },
  { id: 'demo-agent', name: 'مشاور نمونه', email: 'agent@demo.local', role: 'AGENT' as const, agencyId: 'demo-agency' },
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 60 * 60 * 12 },
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
        if (!email || password.length < 8) return null;

        if (isDemoMode) {
          const user = demoUsers.find(item => item.email === email);
          if (!user || password !== 'demo1234') return null;
          return user;
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash || !(await compare(password, user.passwordHash))) return null;
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
