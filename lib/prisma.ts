import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// A configured database must use the real persistence/auth path by default.
// Demo mode is opt-in so a missing DEMO_MODE flag can never silently bypass
// database-backed login security (failed-attempt counters, lockout, 2FA, etc.).
export const isDemoMode = process.env.DEMO_MODE === 'true' || !process.env.DATABASE_URL;
