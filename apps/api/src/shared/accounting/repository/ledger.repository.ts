// Repository layer for the LedgerEntry Aggregate — persistence only,
// append-only. No coordination with Journal Entry persistence (LDG-001's
// "created only from a Posted Journal Entry line" precondition is asserted
// by the Business layer BEFORE calling `appendLedgerEntry`, not by this
// file), no HTTP concerns (05_CODING_STANDARDS.md Ch.14.4).
// `ledger_entries` is tenant-owned (MT-001) — every query below asserts
// `tenantId` explicitly. Only this folder (and the shared Prisma client
// module itself) may import the Prisma client, per Ch.9.5. A SEPARATE
// file/class from both `accounting.repository.ts` and
// `journal-entry.repository.ts` per the frozen "each Aggregate Root gets
// its own Repository" decision.
import { randomUUID } from "crypto";
import { prisma, PrismaTransactionClient } from "../../../database/client";
import { LedgerEntry as LedgerEntryModel, Prisma } from "../../../database/generated/client";
import { LedgerEntry, CreateLedgerEntryProps } from "../domain/entities/ledger-entry.entity";
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
import { DuplicateLedgerEntryForJournalEntryLineError } from "../domain/errors/accounting.errors";
import { ILedgerRepository, RepositoryTransaction } from "../domain/interfaces/ledger-repository.interface";

/** Prisma's unique-constraint violation code (P2002) — used to translate a raw DB conflict on `ledger_entries.journal_entry_line_id` into a typed Domain error, mirroring `createExchangeRate`'s identical translation pattern for its own uniqueness constraint. */
const UNIQUE_CONSTRAINT_VIOLATION = "P2002";

function toLedgerEntryDomain(row: LedgerEntryModel): LedgerEntry {
  return new LedgerEntry(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyUuid,
    row.accountId,
    row.journalEntryLineId,
    // `.toFixed()` (not `.toString()`) guarantees plain fixed-point decimal
    // notation, never exponential notation, as the input to `DecimalValue`
    // (mirroring toExchangeRateDomain's own mapping in accounting.repository.ts).
    DecimalValue.create(row.debitAmount.toFixed()),
    DecimalValue.create(row.creditAmount.toFixed()),
    row.entryDate,
    row.createdAt,
    row.createdBy,
  );
}

/** Generates the external identifier assigned at insert time (06_DATABASE_STANDARDS.md PK-002 — generated in the application layer, not a MySQL default expression). */
function newUuid(): string {
  return randomUUID();
}

export class PrismaLedgerRepository implements ILedgerRepository {
  private client(tx?: RepositoryTransaction): PrismaTransactionClient | typeof prisma {
    return (tx as PrismaTransactionClient | undefined) ?? prisma;
  }

  // LedgerEntry is tenant-owned (06_DATABASE_STANDARDS.md MT-001) — every
  // query below asserts `tenantId` explicitly and independently (MT-002).
  // `id` is never accepted from outside this file (PK-003). No update or
  // remove method exists on this class at all (LDG-002 — append-only).

  async appendLedgerEntry(tenantId: bigint, props: CreateLedgerEntryProps, tx?: RepositoryTransaction): Promise<LedgerEntry> {
    try {
      const row = await this.client(tx).ledgerEntry.create({
        data: {
          uuid: newUuid(),
          tenantId,
          companyUuid: props.companyUuid,
          accountId: props.accountId,
          journalEntryLineId: props.journalEntryLineId,
          debitAmount: props.debitAmount.toString(),
          creditAmount: props.creditAmount.toString(),
          entryDate: props.entryDate,
          createdBy: props.createdBy ?? null,
        },
      });
      return toLedgerEntryDomain(row);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === UNIQUE_CONSTRAINT_VIOLATION) {
        throw new DuplicateLedgerEntryForJournalEntryLineError(props.journalEntryLineId);
      }
      throw error;
    }
  }

  async findLedgerEntryByUuid(tenantId: bigint, uuid: string): Promise<LedgerEntry | null> {
    const row = await prisma.ledgerEntry.findFirst({
      where: { tenantId, uuid },
    });
    return row ? toLedgerEntryDomain(row) : null;
  }

  async findLedgerEntryByJournalEntryLineId(tenantId: bigint, journalEntryLineId: bigint): Promise<LedgerEntry | null> {
    const row = await prisma.ledgerEntry.findFirst({
      where: { tenantId, journalEntryLineId },
    });
    return row ? toLedgerEntryDomain(row) : null;
  }

  async listLedgerEntries(tenantId: bigint, accountId?: bigint): Promise<LedgerEntry[]> {
    const rows = await prisma.ledgerEntry.findMany({
      where: { tenantId, accountId },
      orderBy: { entryDate: "asc" },
    });
    return rows.map(toLedgerEntryDomain);
  }
}
