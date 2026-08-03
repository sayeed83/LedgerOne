// The shared Prisma Client instance referenced by 05_CODING_STANDARDS.md Ch.9.5
// ("Only files under a module's repository folder may import @prisma/client or
// the shared Prisma client instance"). One process-wide instance — repositories
// never construct their own PrismaClient.
import { PrismaClient, Prisma } from "./generated/client";

export const prisma = new PrismaClient();

export type { Prisma };
export type PrismaTransactionClient = Prisma.TransactionClient;

/**
 * For the `/health` endpoint (10_DEPLOYMENT_ARCHITECTURE.md HC-002) — the
 * one narrow capability exposed outside a repository folder, so `server.ts`
 * never needs to import `prisma` itself (Ch.9.5 stays intact: the raw
 * client is still only ever touched from here and from repository/ files).
 */
export async function pingDatabase(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
