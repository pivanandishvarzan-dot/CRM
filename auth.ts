import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma, isDemoMode } from '@/lib/prisma';
import authConfig from '@/auth.config';

const demoUsers = [
  { id: 'demo-manager', name: 'مهدی اکبری', email: 'manager@demo.local', role: 'AGENCY_MANAGER' as const, agencyId: 'demo-agency', sessionVersion: 1 },
  { id: 'demo-agent', name: 'مشاور نمونه', email: 'agent@demo.local', role: 'AGENT' as const, agencyId: 'demo-agency', sessionVersion: 1 },
];

function requestMeta(request?: Request) {
  const headers=request?.headers;
  return {
    ip:(headers?.get('x-forwarded-for')?.split(',')[0]||headers?.get('x-real-ip')||'unknown').trim(),
    userAgent:headers?.get('user-agent')?.slice(0,500)||undefined,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'ورود به خانه‌یار',
      credentials: {
        email: { label: 'ایمیل', type: 'email' },
        password: { label: 'رمز عبور', type: 'password' },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? '').trim().toLowerCase();
        const password = String(credentials?.password ?? '');
        if (!email || password.length < 8) return null;
        if (isDemoMode) {
          const user = demoUsers.find(item => item.email === email);
          if (!user || password !== 'demo1234') return null;
          return user;
        }

        const meta=requestMeta(request);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          await prisma.loginEvent.create({ data: { email, success:false, reason:'UNKNOWN_EMAIL', ...meta } });
          return null;
        }
        if (!user.active) {
          await prisma.loginEvent.create({ data: { userId:user.id, email, success:false, reason:'INACTIVE_ACCOUNT', ...meta } });
          return null;
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await prisma.loginEvent.create({ data: { userId:user.id, email, success:false, reason:'ACCOUNT_LOCKED', ...meta } });
          return null;
        }
        const valid=Boolean(user.passwordHash && await compare(password,user.passwordHash));
        if(!valid){
          const nextAttempts=user.failedLoginAttempts+1;
          const shouldLock=nextAttempts>=5;
          await prisma.$transaction([
            prisma.user.update({where:{id:user.id},data:{failedLoginAttempts:shouldLock?0:nextAttempts,lockedUntil:shouldLock?new Date(Date.now()+15*60_000):null}}),
            prisma.loginEvent.create({data:{userId:user.id,email,success:false,reason:shouldLock?'LOCKED_AFTER_FAILURES':'INVALID_PASSWORD',...meta}}),
          ]);
          return null;
        }
        await prisma.$transaction([
          prisma.user.update({where:{id:user.id},data:{failedLoginAttempts:0,lockedUntil:null}}),
          prisma.loginEvent.create({data:{userId:user.id,email,success:true,reason:'LOGIN_SUCCESS',...meta}}),
        ]);
        return { id: user.id, name: user.name, email: user.email, role: user.role, agencyId: user.agencyId, sessionVersion:user.sessionVersion };
      },
    }),
  ],
});
