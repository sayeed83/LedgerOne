import { FinancialYearStatus } from "../enums/financial-year-status.enum";
import { InvalidFinancialYearStatusTransitionError } from "../errors/accounting.errors";

// Domain aggregate root for a Financial Year (00_BUSINESS_RULES.md Ch.5) —
// the annual accounting/reporting cycle a Company prepares its statutory
// financial statements against. The constructor stays public (rather than a
// validating static factory, Ch.15.5) because the Repository layer's
// `toDomain` mapping (05_CODING_STANDARDS.md Ch.14.6) must reconstruct this
// aggregate directly from an already-valid persisted row; the lifecycle
// invariant a caller can violate (Ch.15.4) is instead enforced by the
// transition methods below (Ch.15.6 — a transition returns a new instance
// rather than mutating in place), mirroring Authorization's Role aggregate
// and User Management's User aggregate. Contiguity/overlap validation
// (FY-002, Ch.5.8) and closing-process mechanics (Ch.32) are explicitly not
// this aggregate's concern — both are later Business-layer milestones.
export class FinancialYear {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly status: FinancialYearStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}

  /** Financial Year lifecycle (00_BUSINESS_RULES.md Ch.5.5): Future → Open — start date reached. */
  open(): FinancialYear {
    if (this.status !== FinancialYearStatus.Future) {
      throw new InvalidFinancialYearStatusTransitionError(this.status, FinancialYearStatus.Open);
    }
    return this.withStatus(FinancialYearStatus.Open);
  }

  /** Financial Year lifecycle (00_BUSINESS_RULES.md Ch.5.5): Open/Closing/Reopened → Closed — closing entries posted, Year locked (or re-closed after correction). */
  close(): FinancialYear {
    if (
      this.status !== FinancialYearStatus.Open &&
      this.status !== FinancialYearStatus.Closing &&
      this.status !== FinancialYearStatus.Reopened
    ) {
      throw new InvalidFinancialYearStatusTransitionError(this.status, FinancialYearStatus.Closed);
    }
    return this.withStatus(FinancialYearStatus.Closed);
  }

  /** Financial Year lifecycle (00_BUSINESS_RULES.md Ch.5.5/FY-004): Closed → Reopened — explicit, approved, heavily audited exception. */
  reopen(): FinancialYear {
    if (this.status !== FinancialYearStatus.Closed) {
      throw new InvalidFinancialYearStatusTransitionError(this.status, FinancialYearStatus.Reopened);
    }
    return this.withStatus(FinancialYearStatus.Reopened);
  }

  private withStatus(status: FinancialYearStatus): FinancialYear {
    return new FinancialYear(
      this.id,
      this.uuid,
      this.tenantId,
      this.companyUuid,
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

/** Fields required to persist a new Financial Year row; identity/timestamps/status default are assigned by the database. */
export interface CreateFinancialYearProps {
  companyUuid: string;
  startDate: Date;
  endDate: Date;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Financial Year row; status is changed only via `openFinancialYear`/`closeFinancialYear`/`reopenFinancialYear`. */
export interface UpdateFinancialYearProps {
  startDate?: Date;
  endDate?: Date;
  updatedBy?: bigint | null;
}
