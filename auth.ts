import NextAuth from 'next-auth';
// Providerهای واقعی را پس از تنظیم AUTH_SECRET اینجا اضافه کنید. رابط نمایشی مستقل است.
export const { handlers, auth, signIn, signOut } = NextAuth({ providers: [], session: { strategy: 'jwt' }, callbacks: { session({session,token}) { if(session.user) session.user.name ||= String(token.name ?? 'کاربر'); return session; } } });
