import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from '@/auth.config';
import { clientIp, rateLimit, sameOrigin } from '@/lib/security';

const { auth } = NextAuth(authConfig);
const publicPaths = ['/login', '/api/auth'];
const managerOnly = ['/reports', '/settings', '/team', '/backup'];

export default auth(request => {
  const pathname = request.nextUrl.pathname;
  if(pathname.startsWith('/api/')&&!sameOrigin(request as unknown as Request))return NextResponse.json({error:'درخواست نامعتبر است.'},{status:403});
  if(pathname.startsWith('/api/')){const ip=clientIp(request as unknown as Request);const limit=pathname.startsWith('/api/auth')?20:180;const rl=rateLimit(`${ip}:${pathname.startsWith('/api/auth')?'auth':'api'}`,limit,60_000);if(!rl.ok)return NextResponse.json({error:'تعداد درخواست‌ها بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.'},{status:429,headers:{'Retry-After':String(rl.retryAfter)}})}
  if (publicPaths.some(path => pathname.startsWith(path))) return NextResponse.next();
  if (!request.auth?.user) {
    const login = new URL('/login', request.nextUrl.origin);
    login.searchParams.set('callbackUrl', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }
  if (managerOnly.some(path => pathname.startsWith(path)) && request.auth.user.role === 'AGENT') return NextResponse.redirect(new URL('/', request.nextUrl.origin));
  return NextResponse.next();
});

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'] };
