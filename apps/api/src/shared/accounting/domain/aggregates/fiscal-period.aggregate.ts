import { FiscalPeriodStatus } from "../enums/fiscal-period-status.enum";
import { InvalidFiscalPeriodStatusTransitionError } from "../errors/accounting.errors";

// Domain aggregate root for a Fiscal Period (00_BUSINESS_RULES.md Ch.6) — the
// monthly-typical subdivision of a Financial Year at which transactions are
// posted and periods are individually closed. The constructor stays public
// (rather than a validating static factory, Ch.15.5) because the Repository
// layer's `toDomain` mapping (05_CODING_STANDARDS.md Ch.14.6) must
// reconstruct this aggregate directly from an already-valid persisted row;
// the lifecycle invariant a caller can violate (Ch.15.4) is instead enforced
// by the transition methods below (Ch.15.6 — a transition returns a new
// instance rather than mutating in place), mirroring FinancialYear's own
// aggregate. Chronological-close ordering (FP-002), overlap validation, and
// posting validation (FP-001) are explicitly not this aggregate's concern —
// all are later Business-layer milestones.
//
// Ch.6.5's lifecycle diagram documents no transition into Open other than
// initial creation (a Fiscal Period is created directly in the Open state,
// per the Database layer's `@default(OPEN)`) — so, unlike FinancialYear's
// `open()` (Future → Open), this aggregate exposes no `open()` method: there
// is no documented `X → Open` edge for it to guard.
export class FiscalPeriod {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly financialYearId: bigint,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly status: FiscalPeriodStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}

  /** Fiscal Period lifecycle (00_BUSINESS_RULES.md Ch.6.5): Open → SoftClosed — period-end review in progress, postings restricted to authorized roles only. */
  softClose(): FiscalPeriod {
    if (this.status !== FiscalPeriodStatus.Open) {
      throw new InvalidFiscalPeriodStatusTransitionError(this.status, FiscalPeriodStatus.SoftClosed);
    }
    return this.withStatus(FiscalPeriodStatus.SoftClosed);
  }

  /** Fiscal Period lifecycle (00_BUSINESS_RULES.md Ch.6.5): SoftClosed/Reopened → Closed — period finalized (or re-closed after correction), no further postings permitted. */
  close(): FiscalPeriod {
    if (this.status !== FiscalPeriodStatus.SoftClosed && this.status !== FiscalPeriodStatus.Reopened) {
      throw new InvalidFiscalPeriodStatusTransitionError(this.status, FiscalPeriodStatus.Closed);
    }
    return this.withStatus(FiscalPeriodStatus.Closed);
  }

  /** Fiscal Period lifecycle (00_BUSINESS_RULES.md Ch.6.5/FP-003): Closed → Reopened — explicit, approved exception. */
  reopen(): FiscalPeriod {
    if (this.status !== FiscalPeriodStatus.Closed) {
      throw new InvalidFiscalPeriodStatusTransitionError(this.status, FiscalPeriodStatus.Reopened);
    }
    return this.withStatus(FiscalPeriodStatus.Reopened);
  }

  private withStatus(status: FiscalPeriodStatus): FiscalPeriod {
    return new FiscalPeriod(
      this.id,
      this.uuid,
      this.tenantId,
      this.companyUuid,
      this.financialYearId,
      this.startDate,
      this.endDate,
      status,
      this.createdAt,
      this.updatedAt,
      this.createdBy,
      this.updatedBy,
      this.deletedAt,
    );
  }
}

/** Fields required to persist a new Fiscal Period row; identity/timestamps/status default are assigned by the database. */
export interface CreateFiscalPeriodProps {
  companyUuid: string;
  financialYearId: bigint;
  startDate: Date;
  endDate: Date;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Fiscal Period row; status is changed only via `openFiscalPeriod`/`softCloseFiscalPeriod`/`closeFiscalPeriod`/`reopenFiscalPeriod`. */
export interface UpdateFiscalPeriodProps {
  startDate?: Date;
  endDate?: Date;
  updatedBy?: bigint | null;
}
