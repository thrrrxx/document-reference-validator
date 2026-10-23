import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma && (globalForPrisma.prisma as any).userSession) {
    return globalForPrisma.prisma;
  }

  if (process.env.NODE_ENV !== 'production' && typeof require !== 'undefined' && require.cache) {
    try {
      Object.keys(require.cache).forEach((key) => {
        if (key.includes('.prisma') || key.includes('@prisma')) {
          delete require.cache[key];
        }
      });
      const FreshPrisma = require('@prisma/client').PrismaClient;
      const freshClient = new FreshPrisma();
      globalForPrisma.prisma = freshClient;
      return freshClient;
    } catch {
      // fallback
    }
  }

  const client = new PrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const db = getPrismaClient();

export default db;


