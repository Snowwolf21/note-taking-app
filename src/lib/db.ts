import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

// Singleton pattern — prevents multiple PrismaClient instances in Next.js dev hot-reload
const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaLibSql({
    url: `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`,
  });
  return new PrismaClient({ adapter } as any);
}

export const db: PrismaClient = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
