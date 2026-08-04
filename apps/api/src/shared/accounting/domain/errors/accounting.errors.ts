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

/** Raised when a lookup by `uuid` matches no Currency row (00_BUSINESS_RULES.md Ch.7) — Currency is platform-owned reference data, so this is a plain not-found, not a tenant-scoped one (no MT-002 re-assertion applies). */
export class CurrencyNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Currency '${identifier}' was not found.`);
  }
}

/**
 * Raised when a requested status change does not follow the Currency
 * lifecycle (00_BUSINESS_RULES.md Ch.7.5/7.8): Active ↔ Inactive.
 */
export class InvalidCurrencyStatusTransitionError extends DomainError {
  constructor(public readonly from: string, public readonly to: string) {
    super(`Currency cannot transition from '${from}' to '${to}'.`);
  }
}

/** Raised by `DecimalValue.create` when a raw string is not a well-formed decimal number (03_ARCHITECTURE.md Ch.7.3.2/05_CODING_STANDARDS.md Ch.15.4 — a Value Object's invariant is enforced by the object itself at construction, not by external validation that could be skipped). */
export class InvalidDecimalValueError extends DomainError {
  constructor(public readonly raw: string) {
    super(`'${raw}' is not a valid decimal value.`);
  }
}

/** Raised by createCurrency when the ISO code already belongs to another (non-deleted) Currency (00_BUSINESS_RULES.md Ch.7.3 — Currency "owns" its ISO code; `currencies.iso_code` is a plain unique column with no `deletedAt` composite, a deliberate never-reuse decision, 06_DATABASE_STANDARDS.md SD-004). */
export class DuplicateCurrencyIsoCodeError extends DomainError {
  constructor(public readonly isoCode: string) {
    super(`Currency ISO code '${isoCode}' already exists.`);
  }
}

/** Raised by createExchangeRate when a referenced Currency is not Active (00_BUSINESS_RULES.md Ch.31.8 — "currency pair must reference two distinct, Active currencies"). */
export class CurrencyNotActiveError extends DomainError {
  constructor(public readonly currencyUuid: string, public readonly status: string) {
    super(`Currency '${currencyUuid}' is not Active (current status: '${status}').`);
  }
}

/** Raised when a lookup by `uuid` matches no Exchange Rate row (00_BUSINESS_RULES.md Ch.31), scoped to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). */
export class ExchangeRateNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Exchange Rate '${identifier}' was not found.`);
  }
}

/** Raised by createExchangeRate when the `from` and `to` Currency are the same (00_BUSINESS_RULES.md Ch.31.8 — "currency pair must reference two distinct... currencies"). */
export class ExchangeRateCurrencyPairNotDistinctError extends DomainError {
  constructor(public readonly currencyUuid: string) {
    super(`Exchange Rate 'from' and 'to' currencies must be distinct; both were '${currencyUuid}'.`);
  }
}

/** Raised by createExchangeRate when the supplied rate value is not positive (00_BUSINESS_RULES.md Ch.31.8 — "Rate value must be a positive number"). */
export class InvalidExchangeRateValueError extends DomainError {
  constructor(public readonly rate: string) {
    super(`Exchange Rate value '${rate}' must be a positive number.`);
  }
}

/** Raised by createExchangeRate when an Exchange Rate already exists for the same currency pair and effective date. Not explicit business-rule text in Ch.31 itself — enforced here as a direct consequence of the Database milestone's own `uq_exchange_rates_tenant_pair_effective_date_deleted_at` uniqueness constraint (06_DATABASE_STANDARDS.md SD-004), so a duplicate attempt fails with a typed Domain error instead of a raw, leaked Prisma unique-constraint violation. */
export class DuplicateExchangeRateError extends DomainError {
  constructor(
    public readonly fromCurrencyUuid: string,
    public readonly toCurrencyUuid: string,
    public readonly effectiveDate: Date,
  ) {
    super(
      `An Exchange Rate for currency pair '${fromCurrencyUuid}' -> '${toCurrencyUuid}' effective '${effectiveDate.toISOString()}' already exists.`,
    );
  }
}
