import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from '@/auth.config';

const { auth } = NextAuth(authConfig);
const publicPaths = ['/login', '/api/auth'];
const managerOnly = ['/reports', '/settings'];

export default auth(request => {
  const pathname = request.nextUrl.pathname;
  if (publicPaths.some(path => pathname.startsWith(path))) return NextResponse.next();

  if (!request.auth?.user) {
    const login = new URL('/login', request.nextUrl.origin);
    login.searchParams.set('callbackUrl', `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(login);
  }

  if (managerOnly.some(path => pathname.startsWith(path)) && request.auth.user.role === 'AGENT') {
    return NextResponse.redirect(new URL('/', request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
