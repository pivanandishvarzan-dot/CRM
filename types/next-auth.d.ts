import 'next-auth';
import 'next-auth/jwt';

type CRMRole = 'SYSTEM_ADMIN' | 'AGENCY_MANAGER' | 'AGENT';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: CRMRole;
      agencyId?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role: CRMRole;
    agencyId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: CRMRole;
    agencyId?: string | null;
  }
}
