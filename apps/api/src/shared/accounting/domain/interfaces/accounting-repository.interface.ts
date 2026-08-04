// Repository interface, owned by the Domain layer per 03_ARCHITECTURE.md
// Decision 5.7.2 — the Repository layer provides the implementation, never
// the contract. Every method is persistence-only (05_CODING_STANDARDS.md
// Ch.14.4): no lifecycle-transition rules (Ch.5.5/FY-004), no
// contiguity/overlap validation (FY-002, Ch.5.8), no closing-process
// mechanics (Ch.32) — those are Business-layer concerns that call these
// methods (03_ARCHITECTURE.md Ch.9.8/Decision 9.9.3, the same
// "Repository is persistence-only" boundary as every other module). Find
// methods return `null`, never throw, when nothing matches
// (05_CODING_STANDARDS.md Ch.8.5/Ch.14).
//
// FinancialYear is tenant-owned (06_DATABASE_STANDARDS.md MT-001, no
// convenience exceptions) — every method takes `tenantId` explicitly and
// re-asserts it in its own query, never relying on a previously-resolved
// row's identity (MT-002, Ch.6.4's worked example).
//
// `companyUuid` is a cross-module reference (FK-002) to Organization's
// `companies.uuid` — looked up/filtered by `uuid`, never a numeric id from
// another module's schema, mirroring User Management's own `companyUuid`
// reference into Organization.
//
// Currency is platform-owned reference data (MT-005, mirrors Authorization's
// Permission) — its methods take no `tenantId`. Exchange Rate is
// tenant-owned (MT-001) like FinancialYear/FiscalPeriod — every method takes
// `tenantId` explicitly and re-asserts it in its own query (MT-002). Exchange
// Rate is an immutable historical time series (Ch.31.5/EXR-002) — no
// update/remove method is provided; a correction is a new, dated rate row (a
// future Business-layer concern).
import { FinancialYear, CreateFinancialYearProps, UpdateFinancialYearProps } from "../aggregates/financial-year.aggregate";
import { FiscalPeriod, CreateFiscalPeriodProps, UpdateFiscalPeriodProps } from "../aggregates/fiscal-period.aggregate";
import { Currency, CreateCurrencyProps, UpdateCurrencyProps } from "../aggregates/currency.aggregate";
import { ExchangeRate, CreateExchangeRateProps } from "../entities/exchange-rate.entity";
import { CurrencyStatus } from "../enums/currency-status.enum";

/**
 * Opaque handle for an in-flight transaction, supplied by the Business
 * layer's `$transaction` callback (03_ARCHITECTURE.md Decision 5.7.3 —
 * transactions are opened only at the Business layer) and passed through
 * unmodified. Kept as `unknown` rather than a Prisma-specific type so this
 * Domain-owned interface stays free of ORM types (Ch.5.3.4); the Repository
 * implementation casts it back to Prisma's transaction client internally.
 */
export type RepositoryTransaction = unknown;

export interface IAccountingRepository {
  createFinancialYear(
    tenantId: bigint,
    props: CreateFinancialYearProps,
    tx?: RepositoryTransaction,
  ): Promise<FinancialYear>;
  findFinancialYearByUuid(tenantId: bigint, uuid: string): Promise<FinancialYear | null>;
  /** Optionally narrowed to a single Company (FK-002 `companyUuid`); omitted, returns every Financial Year for the Tenant. */
  listFinancialYears(tenantId: bigint, companyUuid?: string): Promise<FinancialYear[]>;
  updateFinancialYear(
    tenantId: bigint,
    uuid: string,
    props: UpdateFinancialYearProps,
    tx?: RepositoryTransaction,
  ): Promise<FinancialYear>;
  /** Sets status to Open (00_BUSINESS_RULES.md Ch.5.5) — a raw persistence transition; validating the `from` state is a Business-layer concern (this milestone is Repository-only). */
  openFinancialYear(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<FinancialYear>;
  /** Sets status to Closed (00_BUSINESS_RULES.md Ch.5.5) — a raw persistence transition; validating the `from` state is a Business-layer concern (this milestone is Repository-only). */
  closeFinancialYear(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<FinancialYear>;
  /** Sets status to Reopened (00_BUSINESS_RULES.md Ch.5.5/FY-004) — a raw persistence transition; validating the `from` state is a Business-layer concern (this milestone is Repository-only). */
  reopenFinancialYear(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<FinancialYear>;

  createFiscalPeriod(
    tenantId: bigint,
    props: CreateFiscalPeriodProps,
    tx?: RepositoryTransaction,
  ): Promise<FiscalPeriod>;
  findFiscalPeriodByUuid(tenantId: bigint, uuid: string): Promise<FiscalPeriod | null>;
  /** Optionally narrowed to a single Financial Year; omitted, returns every Fiscal Period for the Tenant. */
  listFiscalPeriods(tenantId: bigint, financialYearId?: bigint): Promise<FiscalPeriod[]>;
  updateFiscalPeriod(
    tenantId: bigint,
    uuid: string,
    props: UpdateFiscalPeriodProps,
    tx?: RepositoryTransaction,
  ): Promise<FiscalPeriod>;
  /** Sets status to Open (00_BUSINESS_RULES.md Ch.6.5) — a raw persistence transition; validating the `from` state is a Business-layer concern (this milestone is Repository-only). */
  openFiscalPeriod(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<FiscalPeriod>;
  /** Sets status to SoftClosed (00_BUSINESS_RULES.md Ch.6.5) — a raw persistence transition; validating the `from` state is a Business-layer concern (this milestone is Repository-only). */
  softCloseFiscalPeriod(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<FiscalPeriod>;
  /** Sets status to Closed (00_BUSINESS_RULES.md Ch.6.5) — a raw persistence transition; validating the `from` state is a Business-layer concern (this milestone is Repository-only). */
  closeFiscalPeriod(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<FiscalPeriod>;
  /** Sets status to Reopened (00_BUSINESS_RULES.md Ch.6.5/FP-003) — a raw persistence transition; validating the `from` state is a Business-layer concern (this milestone is Repository-only). */
  reopenFiscalPeriod(tenantId: bigint, uuid: string, updatedBy?: bigint | null, tx?: RepositoryTransaction): Promise<FiscalPeriod>;

  createCurrency(props: CreateCurrencyProps, tx?: RepositoryTransaction): Promise<Currency>;
  findCurrencyByUuid(uuid: string): Promise<Currency | null>;
  findCurrencyByIsoCode(isoCode: string): Promise<Currency | null>;
  /** Optionally narrowed to a single lifecycle status; omitted, returns every Currency. */
  listCurrencies(status?: CurrencyStatus): Promise<Currency[]>;
  updateCurrency(uuid: string, props: UpdateCurrencyProps, tx?: RepositoryTransaction): Promise<Currency>;
  /** Sets status to Active (00_BUSINESS_RULES.md Ch.7.5/7.8) — a raw persistence transition; validating the `from` state is a Business-layer concern (this milestone is Repository-only). */
  activateCurrency(uuid: string, tx?: RepositoryTransaction): Promise<Currency>;
  /** Sets status to Inactive (00_BUSINESS_RULES.md Ch.7.5/7.8) — a raw persistence transition; validating the `from` state is a Business-layer concern (this milestone is Repository-only). */
  deactivateCurrency(uuid: string, tx?: RepositoryTransaction): Promise<Currency>;

  createExchangeRate(
    tenantId: bigint,
    props: CreateExchangeRateProps,
    tx?: RepositoryTransaction,
  ): Promise<ExchangeRate>;
  findExchangeRateByUuid(tenantId: bigint, uuid: string): Promise<ExchangeRate | null>;
  /** Optionally narrowed to a single currency pair; omitted, returns every Exchange Rate for the Tenant. Ordered by `effectiveDate` descending — resolving "most recently effective" (EXR-001, Ch.31.12) from this ordering is a Business-layer concern. */
  listExchangeRates(tenantId: bigint, fromCurrencyId?: bigint, toCurrencyId?: bigint): Promise<ExchangeRate[]>;
}
