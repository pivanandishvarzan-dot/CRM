import 'next-auth';
import 'next-auth/jwt';
import type {DefaultSession} from 'next-auth';
import type {AppRole} from '@/lib/permissions';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: AppRole;
    };
  }

  interface User {
    role: AppRole;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    role?: AppRole;
  }
}
