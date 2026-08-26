import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { prisma, isDemoMode } from '@/lib/prisma';
import authConfig from '@/auth.config';
import { hashRecoveryCode, verifyTotp } from '@/lib/two-factor';

const demoUsers = [
  { id: 'demo-manager', name: 'مهدی اکبری', email: 'manager@demo.local', role: 'AGENCY_MANAGER' as const, agencyId: 'demo-agency', sessionVersion: 1 },
  { id: 'demo-agent', name: 'مشاور نمونه', email: 'agent@demo.local', role: 'AGENT' as const, agencyId: 'demo-agency', sessionVersion: 1 },
];
function requestMeta(request?: Request) {const headers=request?.headers;return {ip:(headers?.get('x-forwarded-for')?.split(',')[0]||headers?.get('x-real-ip')||'unknown').trim(),userAgent:headers?.get('user-agent')?.slice(0,500)||undefined}}
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [Credentials({name:'ورود به خانه‌یار',credentials:{email:{label:'ایمیل',type:'email'},password:{label:'رمز عبور',type:'password'},twoFactorCode:{label:'کد دومرحله‌ای یا بازیابی',type:'text'}},async authorize(credentials,request){
    const email=String(credentials?.email??'').trim().toLowerCase(),password=String(credentials?.password??''),twoFactorCode=String(credentials?.twoFactorCode??'').trim();if(!email||password.length<8)return null;
    if(isDemoMode){const user=demoUsers.find(item=>item.email===email);if(!user||password!=='demo1234')return null;return user}
    const meta=requestMeta(request),user=await prisma.user.findUnique({where:{email}});if(!user){await prisma.loginEvent.create({data:{email,success:false,reason:'UNKNOWN_EMAIL',...meta}});return null}if(!user.active){await prisma.loginEvent.create({data:{userId:user.id,email,success:false,reason:'INACTIVE_ACCOUNT',...meta}});return null}if(user.lockedUntil&&user.lockedUntil>new Date()){await prisma.loginEvent.create({data:{userId:user.id,email,success:false,reason:'ACCOUNT_LOCKED',...meta}});return null}
    const valid=Boolean(user.passwordHash&&await compare(password,user.passwordHash));if(!valid){const next=user.failedLoginAttempts+1,lock=next>=5;await prisma.$transaction([prisma.user.update({where:{id:user.id},data:{failedLoginAttempts:lock?0:next,lockedUntil:lock?new Date(Date.now()+15*60_000):null}}),prisma.loginEvent.create({data:{userId:user.id,email,success:false,reason:lock?'LOCKED_AFTER_FAILURES':'INVALID_PASSWORD',...meta}})]);return null}
    if(user.twoFactorEnabled){let secondFactorOk=Boolean(user.twoFactorSecret&&verifyTotp(twoFactorCode,user.twoFactorSecret));let recoveryIndex=-1;if(!secondFactorOk&&twoFactorCode){const hashed=hashRecoveryCode(twoFactorCode);recoveryIndex=user.recoveryCodes.indexOf(hashed);secondFactorOk=recoveryIndex>=0}if(!secondFactorOk){await prisma.loginEvent.create({data:{userId:user.id,email,success:false,reason:'INVALID_TWO_FACTOR',...meta}});return null}if(recoveryIndex>=0){await prisma.user.update({where:{id:user.id},data:{recoveryCodes:user.recoveryCodes.filter((_,i)=>i!==recoveryIndex)}})}}
    await prisma.$transaction([prisma.user.update({where:{id:user.id},data:{failedLoginAttempts:0,lockedUntil:null}}),prisma.loginEvent.create({data:{userId:user.id,email,success:true,reason:user.twoFactorEnabled?'LOGIN_SUCCESS_2FA':'LOGIN_SUCCESS',...meta}})]);return{id:user.id,name:user.name,email:user.email,role:user.role,agencyId:user.agencyId,sessionVersion:user.sessionVersion};
  }})],
});
