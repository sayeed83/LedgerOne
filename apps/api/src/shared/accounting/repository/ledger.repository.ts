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
import {
  ILedgerRepository,
  RepositoryTransaction,
  ListLedgerEntriesFilter,
  ListLedgerEntriesResult,
  LedgerEntryPosition,
  LedgerEntrySumBefore,
} from "../domain/interfaces/ledger-repository.interface";

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

  // Canonical Ledger ordering (`entryDate` ascending, `uuid` ascending as the
  // stable tie-breaker) — see `LedgerEntryPosition`'s own doc comment for
  // why. Both methods below share the identical "position" predicate
  // builder so the pagination cursor and the opening-balance boundary can
  // never drift apart into two different orderings.
  async listLedgerEntries(tenantId: bigint, filter: ListLedgerEntriesFilter): Promise<ListLedgerEntriesResult> {
    const { accountId, companyUuid, dateFrom, dateTo, cursor, limit } = filter;
    const rows = await prisma.ledgerEntry.findMany({
      where: {
        AND: [
          {
            tenantId,
            accountId,
            companyUuid,
            entryDate: dateFrom || dateTo ? { gte: dateFrom, lte: dateTo } : undefined,
          },
          cursor ? afterPositionWhere(cursor) : {},
        ],
      },
      orderBy: [{ entryDate: "asc" }, { uuid: "asc" }],
      // One extra row fetched, never returned (PAG-005 `hasMore`) — sliced
      // off below, never exposed to the caller.
      take: limit + 1,
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    return { entries: page.map(toLedgerEntryDomain), hasMore };
  }

  async sumLedgerEntriesBefore(
    tenantId: bigint,
    accountId: bigint,
    companyUuid: string | undefined,
    position?: LedgerEntryPosition,
  ): Promise<LedgerEntrySumBefore> {
    const result = await prisma.ledgerEntry.aggregate({
      where: {
        AND: [{ tenantId, accountId, companyUuid }, position ? beforePositionWhere(position) : {}],
      },
      _sum: { debitAmount: true, creditAmount: true },
    });
    return {
      totalDebit: (result._sum.debitAmount ?? new Prisma.Decimal(0)).toFixed(),
      totalCredit: (result._sum.creditAmount ?? new Prisma.Decimal(0)).toFixed(),
    };
  }
}

/** Keyset predicate for "strictly AFTER `position`" (the next page) — `(entryDate > x) OR (entryDate = x AND uuid > y)`, matching the `[{entryDate:"asc"},{uuid:"asc"}]` ordering exactly so pagination never skips or duplicates a row. */
function afterPositionWhere(position: LedgerEntryPosition): Prisma.LedgerEntryWhereInput {
  return {
    OR: [{ entryDate: { gt: position.entryDate } }, { entryDate: position.entryDate, uuid: { gt: position.uuid } }],
  };
}

/**
 * The opening-balance boundary predicate for `sumLedgerEntriesBefore` —
 * NOT symmetric with `afterPositionWhere`'s strict "greater than", by
 * design, because the two callers mean different things by "position":
 *   - `uuid` omitted: `position` is a plain `dateFrom` threshold (no
 *     specific row) — sum everything strictly BEFORE that date
 *     (`entryDate < x`), since `dateFrom` itself is the page's own
 *     inclusive lower bound and must not be double-counted into the
 *     opening balance.
 *   - `uuid` present: `position` is a pagination cursor — the LAST row
 *     already returned on the PRIOR page. That row's own debit/credit MUST
 *     be folded into the carried-forward balance (it already contributed
 *     to that page's own closing balance), so the tie-break at
 *     `entryDate = x` uses `uuid <= y` (inclusive), not `<` — otherwise the
 *     cursor row's own amount would be silently dropped from every
 *     subsequent page's running balance the first time this function was
 *     written (caught during this milestone's own live verification, fixed
 *     before merge, not a guess).
 */
function beforePositionWhere(position: LedgerEntryPosition): Prisma.LedgerEntryWhereInput {
  if (position.uuid === undefined) {
    return { entryDate: { lt: position.entryDate } };
  }
  const uuid = position.uuid;
  return {
    OR: [{ entryDate: { lt: position.entryDate } }, { entryDate: position.entryDate, uuid: { lte: uuid } }],
  };
}
