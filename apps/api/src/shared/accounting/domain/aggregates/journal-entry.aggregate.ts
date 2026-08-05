import { DecimalValue } from "../value-objects/decimal-value.value-object";
import { JournalEntryStatus } from "../enums/journal-entry-status.enum";
import { InvalidJournalEntryStatusTransitionError } from "../errors/accounting.errors";

// Domain Aggregate Root for a Journal Entry (00_BUSINESS_RULES.md Ch.20) —
// the formal record of a single financial transaction. `JournalEntry` and
// `JournalEntryLine` are modeled in this ONE file per 03_ARCHITECTURE.md
// Ch.7.3.3/7.3.6/7.4 — the debit=credit balance invariant (Ch.16 DBL-001)
// spans the whole Aggregate, so the Aggregate Root and its child Entity are
// kept together, never split across files (Ch.7.14's explicit warning
// against modeling lines as independent Aggregates). Ledger Entry is a
// SEPARATE Aggregate Root (domain/entities/ledger-entry.entity.ts) — see
// that file's doc comment for why it is not merged with this one.
//
// The constructor stays public (rather than a validating static factory,
// Ch.15.5) because the Repository layer's `toDomain` mapping must
// reconstruct this Aggregate directly from already-persisted rows,
// mirroring every other aggregate in this module (Account, FiscalPeriod,
// Currency, FinancialYear).
//
// This is a Repository-layer milestone: DBL-001/002 (balance, at least two
// lines), JRN-002 (Fiscal Period open-check), JRN-004 (approval threshold
// routing), and the construction of a Reversing Entry itself (JRN-003 — a
// NEW JournalEntry with inverted debits/credits, referencing this one) are
// all explicitly Business-layer concerns, not implemented here or anywhere
// in this milestone. The transition methods below are thin, structural
// state-machine guards ONLY (no amount/date/threshold validation) — the
// exact same class of method `Account.activate()`/`FiscalPeriod.close()`
// already implement in this module; they are not "posting logic".
export class JournalEntry {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly postingDate: Date,
    public readonly narration: string | null,
    public readonly status: JournalEntryStatus,
    public readonly reversalOfJournalEntryId: bigint | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
    /** Child Entities of this Aggregate (Ch.7.3.3) — populated by the Repository when loading/creating the full Aggregate; never fetched independently of their parent. */
    public readonly lines: JournalEntryLine[] = [],
  ) {}

  /** Journal Entry lifecycle (00_BUSINESS_RULES.md Ch.20.5): Draft -> PendingApproval — submitted, above the Organization's approval threshold (JRN-004, a Business-layer decision this method does not make). */
  submitForApproval(): JournalEntry {
    if (this.status !== JournalEntryStatus.Draft) {
      throw new InvalidJournalEntryStatusTransitionError(this.status, JournalEntryStatus.PendingApproval);
    }
    return this.withStatus(JournalEntryStatus.PendingApproval);
  }

  /** Journal Entry lifecycle (Ch.20.5): Draft -> Posted (below threshold) or PendingApproval -> Posted (approved). DBL-001/002 balance checking, JRN-002's Fiscal-Period-open check, and Ledger Entry creation (LDG-001) are all Business-layer concerns invoked before this transition, not by it. */
  post(): JournalEntry {
    if (this.status !== JournalEntryStatus.Draft && this.status !== JournalEntryStatus.PendingApproval) {
      throw new InvalidJournalEntryStatusTransitionError(this.status, JournalEntryStatus.Posted);
    }
    return this.withStatus(JournalEntryStatus.Posted);
  }

  /** Journal Entry lifecycle (Ch.13.5/Ch.20.5): PendingApproval -> Draft — rejected, returned for correction (APR-003 — reuses the same entry, never creates a new one). */
  reject(): JournalEntry {
    if (this.status !== JournalEntryStatus.PendingApproval) {
      throw new InvalidJournalEntryStatusTransitionError(this.status, JournalEntryStatus.Draft);
    }
    return this.withStatus(JournalEntryStatus.Draft);
  }

  /** Journal Entry lifecycle (Ch.20.5/JRN-003): Posted -> Reversed. Constructing the reversing entry itself (a new JournalEntry with inverted debits/credits, referencing this one) is a Business-layer concern performed BEFORE this transition — this method only marks the original as superseded once that reversing entry has itself been posted. */
  markReversed(): JournalEntry {
    if (this.status !== JournalEntryStatus.Posted) {
      throw new InvalidJournalEntryStatusTransitionError(this.status, JournalEntryStatus.Reversed);
    }
    return this.withStatus(JournalEntryStatus.Reversed);
  }

  private withStatus(status: JournalEntryStatus): JournalEntry {
    return new JournalEntry(
      this.id,
      this.uuid,
      this.tenantId,
      this.companyUuid,
      this.postingDate,
      this.narration,
      status,
      this.reversalOfJournalEntryId,
      this.createdAt,
      this.updatedAt,
      this.createdBy,
      this.updatedBy,
      this.deletedAt,
      this.lines,
    );
  }
}

/** Fields required to persist a new Journal Entry row, including its lines (created together — the Aggregate is written as a whole, Ch.7.3.3). Identity/timestamps/status default are assigned by the database. */
export interface CreateJournalEntryProps {
  companyUuid: string;
  postingDate: Date;
  narration?: string | null;
  /** Set only when this new entry IS a reversing entry (Ch.20.7 JRN-003) — the original Journal Entry's internal `id`. */
  reversalOfJournalEntryId?: bigint | null;
  lines: CreateJournalEntryLineProps[];
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Journal Entry row while it remains Draft (Ch.20.5's editable state) — enforcing that restriction is a Business-layer concern (JRN-003's posted-immutability), not implemented at this Repository-only milestone. */
export interface UpdateJournalEntryProps {
  postingDate?: Date;
  narration?: string | null;
  updatedBy?: bigint | null;
}

// A single debit or credit line within a Journal Entry
// (00_BUSINESS_RULES.md Ch.20.3/20.10) — a child Entity of the JournalEntry
// Aggregate Root, never an independent Aggregate (03_ARCHITECTURE.md
// Ch.7.14). No lifecycle transitions of its own — a line is added while its
// parent is Draft and frozen once Posted, both Business-layer concerns.
// `debitAmount`/`creditAmount` are `DecimalValue` (not primitives) for the
// same exactness reason `ExchangeRate.rate`/`TaxRule.rate` are — mirroring
// 03_ARCHITECTURE.md Ch.7.3.6's worked `-debit: Money`/`-credit: Money`
// fields (no `Money` Value Object introduced yet, per this milestone's
// explicit scope).
export class JournalEntryLine {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly journalEntryId: bigint,
    public readonly accountId: bigint,
    public readonly debitAmount: DecimalValue,
    public readonly creditAmount: DecimalValue,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Journal Entry Line row — used both nested inside `CreateJournalEntryProps.lines` (initial creation) and standalone via `IJournalEntryRepository.addJournalEntryLine` (adding a line to an already-created Draft entry). Identity/timestamps are assigned by the database. */
export interface CreateJournalEntryLineProps {
  accountId: bigint;
  debitAmount: DecimalValue;
  creditAmount: DecimalValue;
  createdBy?: bigint | null;
}
