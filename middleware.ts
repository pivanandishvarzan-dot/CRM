import NextAuth from 'next-auth';
import authConfig from './auth.config';

export default NextAuth(authConfig).auth;

export const config={
  matcher:[
    '/dashboard/:path*',
    '/properties/:path*',
    '/owners/:path*',
    '/applicants/:path*',
    '/followups/:path*',
    '/contracts/:path*',
    '/reports/:path*',
    '/settings/:path*'
  ]
};
