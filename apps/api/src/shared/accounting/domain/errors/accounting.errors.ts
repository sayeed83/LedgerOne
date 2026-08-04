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
