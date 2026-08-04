import { CurrencyStatus } from "../enums/currency-status.enum";
import { InvalidCurrencyStatusTransitionError } from "../errors/accounting.errors";

// Domain aggregate root for a Currency (00_BUSINESS_RULES.md Ch.7) — a unit
// of monetary value LedgerOne supports for transactions/reporting. Platform-
// owned reference data (Ch.7.5, mirrors Authorization's Permission/MT-005),
// not tenant-scoped. The constructor stays public (rather than a validating
// static factory, Ch.15.5) because the Repository layer's `toDomain` mapping
// (05_CODING_STANDARDS.md Ch.14.6) must reconstruct this aggregate directly
// from an already-valid persisted row; the lifecycle invariant a caller can
// violate (Ch.15.4) is instead enforced by the transition methods below
// (Ch.15.6 — a transition returns a new instance rather than mutating in
// place), mirroring FinancialYear's/FiscalPeriod's own aggregates.
// Company-Currency activation (Ch.7.8/7.10) and precision/consistency
// validation (CUR-003) are explicitly not this aggregate's concern — both
// are later Business-layer milestones.
export class Currency {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly isoCode: string,
    public readonly name: string,
    public readonly symbol: string,
    public readonly decimalPrecision: number,
    public readonly status: CurrencyStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}

  /** Currency lifecycle (00_BUSINESS_RULES.md Ch.7.5/7.8): Inactive → Active. */
  activate(): Currency {
    if (this.status !== CurrencyStatus.Inactive) {
      throw new InvalidCurrencyStatusTransitionError(this.status, CurrencyStatus.Active);
    }
    return this.withStatus(CurrencyStatus.Active);
  }

  /** Currency lifecycle (00_BUSINESS_RULES.md Ch.7.5/7.8): Active → Inactive — an Inactive Currency cannot be selected on a new transaction (Ch.7.8) or referenced by a new Exchange Rate (Ch.31.8). */
  deactivate(): Currency {
    if (this.status !== CurrencyStatus.Active) {
      throw new InvalidCurrencyStatusTransitionError(this.status, CurrencyStatus.Inactive);
    }
    return this.withStatus(CurrencyStatus.Inactive);
  }

  private withStatus(status: CurrencyStatus): Currency {
    return new Currency(
      this.id,
      this.uuid,
      this.isoCode,
      this.name,
      this.symbol,
      this.decimalPrecision,
      status,
      this.createdAt,
      this.updatedAt,
      this.deletedAt,
    );
  }
}

/** Fields required to persist a new Currency row; identity/timestamps/status default are assigned by the database. */
export interface CreateCurrencyProps {
  isoCode: string;
  name: string;
  symbol: string;
  decimalPrecision: number;
}

/** Fields a caller may revise on an existing Currency row; status is changed only via `activateCurrency`/`deactivateCurrency`. */
export interface UpdateCurrencyProps {
  name?: string;
  symbol?: string;
  decimalPrecision?: number;
}
