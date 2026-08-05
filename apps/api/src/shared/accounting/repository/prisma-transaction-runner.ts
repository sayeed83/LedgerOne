// Repository-layer implementation of `ITransactionRunner` — the only file
// besides the module's other repository/*.ts files (and the shared Prisma
// client module itself) permitted to import the Prisma client
// (05_CODING_STANDARDS.md Ch.9.5). Exists solely so the Business layer can
// open a `$transaction` (Ch.20.3) without ever importing Prisma itself.
import { prisma } from "../../../database/client";
import { ITransactionRunner } from "../domain/interfaces/transaction-runner.interface";

export class PrismaTransactionRunner implements ITransactionRunner {
  async run<T>(fn: (tx: unknown) => Promise<T>): Promise<T> {
    return prisma.$transaction((tx) => fn(tx));
  }
}
