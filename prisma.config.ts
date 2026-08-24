import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load Next.js .env.local file for the Prisma CLI
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    path: path.join('prisma', 'migrations'),
  },
  datasource: {
    url: process.env.DATABASE_URL || `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`,
  },
});
