// Repository layer for the JournalEntry Aggregate — persistence only. No
// balance validation (DBL-001/002), no Fiscal-Period-open check (JRN-002),
// no approval-threshold routing (JRN-004), no Ledger coordination
// (LDG-001), no HTTP concerns (05_CODING_STANDARDS.md Ch.14.4).
// `journal_entries`/`journal_entry_lines` are tenant-owned (MT-001) — every
// query below asserts `tenantId` explicitly. Only this folder (and the
// shared Prisma client module itself) may import the Prisma client, per
// Ch.9.5. A SEPARATE file/class from `accounting.repository.ts` per the
// frozen "each Aggregate Root gets its own Repository" decision —
// `IAccountingRepository` is never imported or extended here.
import { randomUUID } from "crypto";
import { prisma, PrismaTransactionClient } from "../../../database/client";
import {
  JournalEntry as JournalEntryModel,
  JournalEntryLine as JournalEntryLineModel,
  JournalEntryStatus as PrismaJournalEntryStatus,
  Prisma,
} from "../../../database/generated/client";
import {
  JournalEntry,
  JournalEntryLine,
  CreateJournalEntryProps,
  UpdateJournalEntryProps,
  CreateJournalEntryLineProps,
} from "../domain/aggregates/journal-entry.aggregate";
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
import { JournalEntryStatus } from "../domain/enums/journal-entry-status.enum";
import { JournalEntryNotFoundError, JournalEntryLineNotFoundError } from "../domain/errors/accounting.errors";
import { IJournalEntryRepository, RepositoryTransaction } from "../domain/interfaces/journal-entry-repository.interface";

type JournalEntryModelWithLines = JournalEntryModel & { lines: JournalEntryLineModel[] };

function toJournalEntryLineDomain(row: JournalEntryLineModel): JournalEntryLine {
  return new JournalEntryLine(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyUuid,
    row.journalEntryId,
    row.accountId,
    // `.toFixed()` (not `.toString()`) guarantees plain fixed-point decimal
    // notation, never exponential notation, as the input to `DecimalValue`
    // (mirroring toExchangeRateDomain's own mapping in accounting.repository.ts).
    DecimalValue.create(row.debitAmount.toFixed()),
    DecimalValue.create(row.creditAmount.toFixed()),
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

function toJournalEntryDomain(row: JournalEntryModelWithLines): JournalEntry {
  return new JournalEntry(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyUuid,
    row.postingDate,
    row.narration,
    row.status as unknown as JournalEntryStatus,
    row.reversalOfJournalEntryId,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
    row.lines.map(toJournalEntryLineDomain),
  );
}

/** Generates the external identifier assigned at insert time (06_DATABASE_STANDARDS.md PK-002 — generated in the application layer, not a MySQL default expression). */
function newUuid(): string {
  return randomUUID();
}

/** Shared `include`/`where` fragment so every read of a JournalEntry loads its lines together (Ch.7.3.3 — Aggregate Root and child Entity always travel together), excluding soft-deleted lines. */
const WITH_LINES = {
  include: { lines: { where: { deletedAt: null } } },
} as const;

export class PrismaJournalEntryRepository implements IJournalEntryRepository {
  private client(tx?: RepositoryTransaction): PrismaTransactionClient | typeof prisma {
    return (tx as PrismaTransactionClient | undefined) ?? prisma;
  }

  // JournalEntry is tenant-owned (06_DATABASE_STANDARDS.md MT-001) — every
  // query below asserts `tenantId` explicitly and independently, never
  // trusting a previously-resolved row (MT-002, Ch.6.4's worked example).
  // `id` is never accepted from outside this file (PK-003) — mutations key
  // on `(tenantId, uuid)`. `accountId` (on lines) is a real, in-module FK —
  // accepted as a plain bigint, no cross-repository existence/Active-status
  // validation (a future Business-layer concern).

  async createJournalEntry(
    tenantId: bigint,
    props: CreateJournalEntryProps,
    tx?: RepositoryTransaction,
  ): Promise<JournalEntry> {
    const row = await this.client(tx).journalEntry.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyUuid: props.companyUuid,
        postingDate: props.postingDate,
        narration: props.narration ?? null,
        reversalOfJournalEntryId: props.reversalOfJournalEntryId ?? null,
        createdBy: props.createdBy ?? null,
        lines: {
          create: props.lines.map((line) => this.lineCreateData(tenantId, props.companyUuid, line)),
        },
      },
      ...WITH_LINES,
    });
    return toJournalEntryDomain(row);
  }

  private lineCreateData(
    tenantId: bigint,
    companyUuid: string,
    props: CreateJournalEntryLineProps,
  ): Prisma.JournalEntryLineUncheckedCreateWithoutJournalEntryInput {
    return {
      uuid: newUuid(),
      tenantId,
      companyUuid,
      accountId: props.accountId,
      debitAmount: props.debitAmount.toString(),
      creditAmount: props.creditAmount.toString(),
      createdBy: props.createdBy ?? null,
    };
  }

  async findJournalEntryByUuid(tenantId: bigint, uuid: string): Promise<JournalEntry | null> {
    const row = await prisma.journalEntry.findFirst({
      where: { tenantId, uuid, deletedAt: null },
      ...WITH_LINES,
    });
    return row ? toJournalEntryDomain(row) : null;
  }

  async listJournalEntries(
    tenantId: bigint,
    companyUuid?: string,
    status?: JournalEntryStatus,
  ): Promise<JournalEntry[]> {
    const rows = await prisma.journalEntry.findMany({
      where: {
        tenantId,
        companyUuid,
        status: status ? (status as unknown as PrismaJournalEntryStatus) : undefined,
        deletedAt: null,
      },
      orderBy: { postingDate: "desc" },
      ...WITH_LINES,
    });
    return rows.map(toJournalEntryDomain);
  }

  async updateJournalEntry(
    tenantId: bigint,
    uuid: string,
    props: UpdateJournalEntryProps,
    tx?: RepositoryTransaction,
  ): Promise<JournalEntry> {
    const client = this.client(tx);
    const { count } = await client.journalEntry.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        postingDate: props.postingDate,
        narration: props.narration,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new JournalEntryNotFoundError(uuid);
    }
    const row = await client.journalEntry.findFirst({ where: { tenantId, uuid }, ...WITH_LINES });
    return toJournalEntryDomain(row as JournalEntryModelWithLines);
  }

  async submitJournalEntryForApproval(
    tenantId: bigint,
    uuid: string,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<JournalEntry> {
    return this.transitionStatus(tenantId, uuid, PrismaJournalEntryStatus.PENDING_APPROVAL, updatedBy, tx);
  }

  async postJournalEntry(
    tenantId: bigint,
    uuid: string,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<JournalEntry> {
    return this.transitionStatus(tenantId, uuid, PrismaJournalEntryStatus.POSTED, updatedBy, tx);
  }

  async rejectJournalEntry(
    tenantId: bigint,
    uuid: string,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<JournalEntry> {
    return this.transitionStatus(tenantId, uuid, PrismaJournalEntryStatus.DRAFT, updatedBy, tx);
  }

  async markJournalEntryReversed(
    tenantId: bigint,
    uuid: string,
    updatedBy?: bigint | null,
    tx?: RepositoryTransaction,
  ): Promise<JournalEntry> {
    return this.transitionStatus(tenantId, uuid, PrismaJournalEntryStatus.REVERSED, updatedBy, tx);
  }

  private async transitionStatus(
    tenantId: bigint,
    uuid: string,
    status: PrismaJournalEntryStatus,
    updatedBy: bigint | null | undefined,
    tx: RepositoryTransaction | undefined,
  ): Promise<JournalEntry> {
    const client = this.client(tx);
    const { count } = await client.journalEntry.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: { status, updatedBy: updatedBy ?? undefined },
    });
    if (count === 0) {
      throw new JournalEntryNotFoundError(uuid);
    }
    const row = await client.journalEntry.findFirst({ where: { tenantId, uuid }, ...WITH_LINES });
    return toJournalEntryDomain(row as JournalEntryModelWithLines);
  }

  async addJournalEntryLine(
    tenantId: bigint,
    journalEntryId: bigint,
    props: CreateJournalEntryLineProps,
    tx?: RepositoryTransaction,
  ): Promise<JournalEntryLine> {
    const client = this.client(tx);
    const parent = await client.journalEntry.findFirst({
      where: { tenantId, id: journalEntryId, deletedAt: null },
    });
    if (!parent) {
      throw new JournalEntryNotFoundError(journalEntryId.toString());
    }
    const row = await client.journalEntryLine.create({
      data: {
        journalEntryId,
        ...this.lineCreateData(tenantId, parent.companyUuid, props),
      },
    });
    return toJournalEntryLineDomain(row);
  }

  async removeJournalEntryLine(tenantId: bigint, lineUuid: string, tx?: RepositoryTransaction): Promise<void> {
    const client = this.client(tx);
    const { count } = await client.journalEntryLine.updateMany({
      where: { tenantId, uuid: lineUuid, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (count === 0) {
      throw new JournalEntryLineNotFoundError(lineUuid);
    }
  }
}
