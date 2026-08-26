import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma, isDemoMode } from '@/lib/prisma';
import authConfig from '@/auth.config';

const demoUsers = [
  { id: 'demo-manager', name: 'مهدی اکبری', email: 'manager@demo.local', role: 'AGENCY_MANAGER' as const, agencyId: 'demo-agency' },
  { id: 'demo-agent', name: 'مشاور نمونه', email: 'agent@demo.local', role: 'AGENT' as const, agencyId: 'demo-agency' },
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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
        if (!user?.active || !user.passwordHash || !(await compare(password, user.passwordHash))) return null;
        return { id: user.id, name: user.name, email: user.email, role: user.role, agencyId: user.agencyId };
      },
    }),
  ],
});
