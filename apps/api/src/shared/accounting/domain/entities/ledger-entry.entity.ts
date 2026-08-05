import { DecimalValue } from "../value-objects/decimal-value.value-object";

// Domain entity for a Ledger Entry (00_BUSINESS_RULES.md Ch.19) — the
// complete, chronological record of posted transactions affecting a
// specific Account. A SEPARATE Aggregate Root from `JournalEntry`
// (domain/aggregates/journal-entry.aggregate.ts) — see that file's doc
// comment and the earlier architecture review for the full rationale:
// LDG-001 makes a Ledger Entry a downstream effect of Journal Entry
// posting, not a component of the debit=credit balance invariant, and
// 03_ARCHITECTURE.md Ch.7.6.1 requires a use case spanning two Aggregates
// to be two separate Aggregate saves coordinated by the Business layer —
// so `LedgerEntry` gets its own Repository interface
// (`ILedgerRepository`), never `IJournalEntryRepository`.
//
// Placed under `domain/entities/` (not `domain/aggregates/`), mirroring
// this module's own established convention: `aggregates/` is reserved for
// models with a lifecycle state machine and transition methods
// (FinancialYear, FiscalPeriod, Currency, Account); `entities/` holds
// models with no lifecycle (ExchangeRate, TaxGroup, TaxRule, AccountGroup).
// A Ledger Entry has no status/lifecycle at all — LDG-002 makes it
// immutable from the instant of creation — so despite being its own
// Aggregate Root in the DDD/repository-boundary sense, it belongs here
// folder-wise, exactly like ExchangeRate (also an immutable historical
// record with "no lifecycle transitions... exposes no transition methods").
//
// No transition/mutation methods of any kind (LDG-002 — "immutable once
// created... never edited or deleted"), stronger than every other entity in
// this module (which permit at least a status change or a revision).
// `debitAmount`/`creditAmount` are `DecimalValue`, mirrored from the source
// Journal Entry Line at the moment of posting — see the Prisma schema's own
// documented denormalization rationale.
export class LedgerEntry {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly accountId: bigint,
    public readonly journalEntryLineId: bigint,
    public readonly debitAmount: DecimalValue,
    public readonly creditAmount: DecimalValue,
    public readonly entryDate: Date,
    public readonly createdAt: Date,
    public readonly createdBy: bigint | null,
  ) {}
}

/** Fields required to append a new Ledger Entry row (LDG-001 — created only from a Posted Journal Entry line). Identity/`createdAt` are assigned by the database; there is no update/remove counterpart (LDG-002). */
export interface CreateLedgerEntryProps {
  companyUuid: string;
  accountId: bigint;
  journalEntryLineId: bigint;
  debitAmount: DecimalValue;
  creditAmount: DecimalValue;
  entryDate: Date;
  createdBy?: bigint | null;
}
