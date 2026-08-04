// Typed error hierarchy (05_CODING_STANDARDS.md Ch.18.3) — every business
// condition this module's use cases can fail with gets a named subclass of
// DomainError; presentation-layer code (not built yet) maps these to HTTP
// status codes. Never a bare `throw new Error(...)` for a known condition.
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Financial Year does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). */
export class FinancialYearNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Financial Year '${identifier}' was not found.`);
  }
}

/**
 * Raised when a requested status change does not follow the Financial Year
 * lifecycle state machine (00_BUSINESS_RULES.md Ch.5.5): Future → Open →
 * Closing → Closed → Reopened → Closed. Every other transition is invalid.
 */
export class InvalidFinancialYearStatusTransitionError extends DomainError {
  constructor(public readonly from: string, public readonly to: string) {
    super(`Financial Year cannot transition from '${from}' to '${to}'.`);
  }
}

/** Raised when a Financial Year's start/end date range would overlap another Financial Year already registered for the same Company (00_BUSINESS_RULES.md Ch.5.7 FY-002, Ch.5.8 Validation Rules). */
export class FinancialYearOverlapError extends DomainError {
  constructor(public readonly companyUuid: string, public readonly startDate: Date, public readonly endDate: Date) {
    super(
      `Financial Year from '${startDate.toISOString()}' to '${endDate.toISOString()}' overlaps an existing Financial Year for Company '${companyUuid}'.`,
    );
  }
}

/** Raised by ValidateFinancialYearOpen — the guard other modules' use cases (e.g. Journal Entries, not built yet) call before allowing a posting-affecting operation to proceed (00_BUSINESS_RULES.md Ch.5.7 FY-003 — no transaction may be posted into a Closed Financial Year). */
export class FinancialYearNotOpenError extends DomainError {
  constructor(public readonly financialYearUuid: string, public readonly status: string) {
    super(`Financial Year '${financialYearUuid}' is not Open (current status: '${status}').`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Fiscal Period does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). */
export class FiscalPeriodNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Fiscal Period '${identifier}' was not found.`);
  }
}

/**
 * Raised when a requested status change does not follow the Fiscal Period
 * lifecycle state machine (00_BUSINESS_RULES.md Ch.6.5): Open → SoftClosed →
 * Closed → Reopened → Closed. Every other transition is invalid.
 */
export class InvalidFiscalPeriodStatusTransitionError extends DomainError {
  constructor(public readonly from: string, public readonly to: string) {
    super(`Fiscal Period cannot transition from '${from}' to '${to}'.`);
  }
}

/** Raised when a Fiscal Period's start/end date range would overlap another Fiscal Period already registered within the same Financial Year (00_BUSINESS_RULES.md Ch.6 — a Fiscal Period is a non-overlapping subdivision of its Financial Year). `financialYearRef` is the Financial Year's `uuid` where the caller already has it (create), or its internal `id` stringified where it does not (update, which only holds the already-persisted Fiscal Period's `financialYearId`). */
export class FiscalPeriodOverlapError extends DomainError {
  constructor(public readonly financialYearRef: string, public readonly startDate: Date, public readonly endDate: Date) {
    super(
      `Fiscal Period from '${startDate.toISOString()}' to '${endDate.toISOString()}' overlaps an existing Fiscal Period within Financial Year '${financialYearRef}'.`,
    );
  }
}

/** Raised when attempting to modify (revise dates on) a Fiscal Period that is already Closed (00_BUSINESS_RULES.md Ch.6.8 Validation Rules — a Closed period's postings/records are final). */
export class FiscalPeriodClosedError extends DomainError {
  constructor(public readonly fiscalPeriodUuid: string) {
    super(`Fiscal Period '${fiscalPeriodUuid}' is Closed and cannot be modified.`);
  }
}

/** Raised by ValidateFiscalPeriodOpen — the guard other modules' use cases (e.g. Journal Entries, not built yet) call before allowing a posting-affecting operation to proceed (00_BUSINESS_RULES.md Ch.6.7 FP-001 — every transaction's posting date must fall within an Open, or Soft-Closed if authorized, Fiscal Period; this guard enforces the plain Open case). */
export class FiscalPeriodNotOpenError extends DomainError {
  constructor(public readonly fiscalPeriodUuid: string, public readonly status: string) {
    super(`Fiscal Period '${fiscalPeriodUuid}' is not Open (current status: '${status}').`);
  }
}
