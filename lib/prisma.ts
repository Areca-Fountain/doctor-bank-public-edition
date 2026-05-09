import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Prevent TypeScript errors in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Set up the Postgres connection
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });

// FIX 1: Bypass the pg Pool type mismatch
const adapter = new PrismaPg(pool as any);

// FIX 2: Bypass the stale PrismaClient types temporarily
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ adapter } as any);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;