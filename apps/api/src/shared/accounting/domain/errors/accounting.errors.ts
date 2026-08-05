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

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Account Group does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Thrown by `updateAccountGroup` on zero rows matched (`updateMany`+refetch pattern). */
export class AccountGroupNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Account Group '${identifier}' was not found.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Account does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Thrown by `updateAccount`/`activateAccount`/`deactivateAccount` on zero rows matched (`updateMany`+refetch pattern). */
export class AccountNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Account '${identifier}' was not found.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Journal Entry does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Thrown by `updateJournalEntry`/`submitJournalEntryForApproval`/`postJournalEntry`/`rejectJournalEntry`/`markJournalEntryReversed` on zero rows matched (`updateMany`+refetch pattern). */
export class JournalEntryNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Journal Entry '${identifier}' was not found.`);
  }
}

/**
 * Raised when a requested status change does not follow the Journal Entry
 * lifecycle state machine (00_BUSINESS_RULES.md Ch.20.5): Draft ->
 * PendingApproval -> Posted -> Reversed, with PendingApproval -> Draft
 * (Rejected) and Draft -> Posted (below threshold) also valid. Every other
 * transition is invalid.
 */
export class InvalidJournalEntryStatusTransitionError extends DomainError {
  constructor(public readonly from: string, public readonly to: string) {
    super(`Journal Entry cannot transition from '${from}' to '${to}'.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Journal Entry Line does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Thrown by `removeJournalEntryLine` on zero rows matched (`updateMany`+refetch pattern). */
export class JournalEntryLineNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Journal Entry Line '${identifier}' was not found.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Ledger Entry does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Ledger Entry has no update/remove method (LDG-002 immutability), so this is thrown only by `findLedgerEntryByUuid`'s callers, mirroring `ExchangeRateNotFoundError`'s identical find-only usage. */
export class LedgerEntryNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Ledger Entry '${identifier}' was not found.`);
  }
}

/** Raised by `appendLedgerEntry` when a Ledger Entry already exists for the given Journal Entry Line (00_BUSINESS_RULES.md Ch.19.10's one-to-one "derived from" cardinality) — enforced here as a direct consequence of the Database milestone's own `ledger_entries_journal_entry_line_id_key` uniqueness constraint, so a duplicate append fails with a typed Domain error instead of a raw, leaked Prisma unique-constraint violation, mirroring `DuplicateExchangeRateError`'s identical reasoning. */
export class DuplicateLedgerEntryForJournalEntryLineError extends DomainError {
  constructor(public readonly journalEntryLineId: bigint) {
    super(`A Ledger Entry already exists for Journal Entry Line '${journalEntryLineId.toString()}'.`);
  }
}

/** Raised by `createJournalEntry`/`validateJournalEntryPostable` when a Journal Entry has fewer than two lines (00_BUSINESS_RULES.md Ch.16 DBL-002 — "a single-account entry is never valid, since it cannot represent a real economic exchange"). */
export class JournalEntryMinimumLinesError extends DomainError {
  constructor(public readonly lineCount: number) {
    super(`A Journal Entry must have at least two lines (found ${lineCount}).`);
  }
}

/** Raised by `createJournalEntry`/`validateJournalEntryPostable` when a Journal Entry's lines reference fewer than two distinct Accounts (00_BUSINESS_RULES.md Ch.16 DBL-002 — "must affect at least two distinct accounts"). */
export class JournalEntryMinimumDistinctAccountsError extends DomainError {
  constructor(public readonly distinctAccountCount: number) {
    super(`A Journal Entry must affect at least two distinct accounts (found ${distinctAccountCount}).`);
  }
}

/** Raised by `createJournalEntry` when a single line's debit/credit amounts do not represent exactly one side of the entry — both positive, or both zero (00_BUSINESS_RULES.md Ch.16 DBL-003/03_ARCHITECTURE.md Ch.7.3.6's `-debit: Money`/`-credit: Money` line shape — a line is a debit OR a credit, never both, never neither). */
export class InvalidJournalEntryLineAmountError extends DomainError {
  constructor(public readonly debitAmount: string, public readonly creditAmount: string) {
    super(`Journal Entry line must have exactly one positive amount (debit='${debitAmount}', credit='${creditAmount}').`);
  }
}

/** Raised by `validateJournalEntryBalanced`/`validateJournalEntryPostable` when a Journal Entry's total debits do not exactly equal its total credits (00_BUSINESS_RULES.md Ch.16 DBL-001 — "zero business exception"). */
export class JournalEntryNotBalancedError extends DomainError {
  constructor(public readonly totalDebit: string, public readonly totalCredit: string) {
    super(`Journal Entry is not balanced: total debit '${totalDebit}' does not equal total credit '${totalCredit}'.`);
  }
}

/** Raised by `validatePostingAccount` when the referenced Account is not Active (00_BUSINESS_RULES.md Ch.20.8 — "every line must reference an Active account"). */
export class AccountNotActiveError extends DomainError {
  constructor(public readonly accountUuid: string, public readonly status: string) {
    super(`Account '${accountUuid}' is not Active (current status: '${status}').`);
  }
}

/** Raised by `validatePostingAccount` when the referenced Account is a Summary Account (`isPostingAccount = false`) — the frozen architectural decision that only Posting Accounts may receive Journal Entry postings (accounting.prisma's `Account` model doc comment). */
export class AccountNotPostableError extends DomainError {
  constructor(public readonly accountUuid: string) {
    super(`Account '${accountUuid}' is a Summary Account and cannot receive Journal Entry postings.`);
  }
}

/** Raised by `updateJournalEntry` when the target Journal Entry is not Draft (00_BUSINESS_RULES.md Ch.20.5/JRN-003 — only a Draft entry is editable; a Posted entry's correction path is a Reversing Entry, never a direct edit). */
export class JournalEntryNotEditableError extends DomainError {
  constructor(public readonly journalEntryUuid: string, public readonly status: string) {
    super(`Journal Entry '${journalEntryUuid}' is not editable (current status: '${status}'); only a Draft entry may be revised.`);
  }
}

/** Raised by `validateJournalEntryPostable` when no Fiscal Period's date range contains the Journal Entry's posting date (00_BUSINESS_RULES.md Ch.20.7 JRN-002 — a posting date must fall within a Fiscal Period at all, before that period's Open/Closed status can even be checked). */
export class NoFiscalPeriodForPostingDateError extends DomainError {
  constructor(public readonly companyUuid: string, public readonly postingDate: Date) {
    super(`No Fiscal Period covers posting date '${postingDate.toISOString()}' for Company '${companyUuid}'.`);
  }
}

/**
 * Raised when a requested status change does not follow the Account
 * lifecycle state machine (00_BUSINESS_RULES.md Ch.17.5): Draft/Inactive →
 * Active, Active → Inactive. Every other transition is invalid.
 */
export class InvalidAccountStatusTransitionError extends DomainError {
  constructor(public readonly from: string, public readonly to: string) {
    super(`Account cannot transition from '${from}' to '${to}'.`);
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

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Tax Group does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Thrown by `updateTaxGroup` (Repository, on zero rows matched) and by `getTaxGroup`/`updateTaxGroup`/`createTaxRule`/`listTaxRules` (Business layer, when a referenced Tax Group cannot be resolved). */
export class TaxGroupNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Tax Group '${identifier}' was not found.`);
  }
}

/** Raised by `createTaxGroup`/`updateTaxGroup` when a Tax Group with the same name already exists for the Company (excluding the row being updated itself). Not explicit Ch.67 business-rule text — enforced here as a direct consequence of the Database milestone's own `uq_tax_groups_tenant_company_name_deleted_at` uniqueness constraint (06_DATABASE_STANDARDS.md SD-004), so a duplicate attempt fails with a typed Domain error instead of a raw, leaked Prisma unique-constraint violation, mirroring `DuplicateExchangeRateError`'s identical reasoning. */
export class DuplicateTaxGroupNameError extends DomainError {
  constructor(public readonly companyUuid: string, public readonly taxGroupName: string) {
    super(`Tax Group '${taxGroupName}' already exists for Company '${companyUuid}'.`);
  }
}

/** Raised when a tenant-scoped lookup by `uuid` matches no row — either the Tax Rule does not exist or it does not belong to the resolved tenant (06_DATABASE_STANDARDS.md MT-002). Tax Rule has no update method (TXR-003 immutability), so this is thrown only by `getTaxRule`, mirroring `ExchangeRateNotFoundError`'s identical find-only usage. */
export class TaxRuleNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Tax Rule '${identifier}' was not found.`);
  }
}

/** Raised by `createTaxRule` when the new effective date range overlaps an existing Tax Rule already registered for the same Tax Group (00_BUSINESS_RULES.md Ch.68.7 TXR-001 — "exactly one rule must be resolvable for any given transaction date"). A `null` `effectiveTo` means open-ended (still in effect). */
export class TaxRuleOverlapError extends DomainError {
  constructor(
    public readonly taxGroupUuid: string,
    public readonly effectiveFrom: Date,
    public readonly effectiveTo: Date | null,
  ) {
    super(
      `Tax Rule effective from '${effectiveFrom.toISOString()}'${effectiveTo ? ` to '${effectiveTo.toISOString()}'` : " (open-ended)"} overlaps an existing Tax Rule for Tax Group '${taxGroupUuid}'.`,
    );
  }
}

/** Raised by `createTaxRule` when a supplied `effectiveTo` is earlier than `effectiveFrom` — a structurally invalid range for Ch.68.7 TXR-001's "effective date range" concept. Not explicit handbook text (a documented Handbook Deviation, the minimum structural invariant a "range" implies). */
export class InvalidTaxRuleEffectiveDateRangeError extends DomainError {
  constructor(public readonly effectiveFrom: Date, public readonly effectiveTo: Date) {
    super(
      `Tax Rule effective date range is invalid: 'effectiveTo' (${effectiveTo.toISOString()}) is before 'effectiveFrom' (${effectiveFrom.toISOString()}).`,
    );
  }
}

/** Raised by `createTaxRule` when the supplied rate is negative (00_BUSINESS_RULES.md Ch.68.8 — "Rate must be a non-negative percentage or fixed amount as configured"). Zero is explicitly valid (Ch.67.11's "Zero Rate" Tax Group example), unlike Exchange Rate's stricter positive-only rule. */
export class InvalidTaxRateValueError extends DomainError {
  constructor(public readonly rate: string) {
    super(`Tax Rule rate '${rate}' must be a non-negative percentage.`);
  }
}

/** Raised by `createAccountGroup`/`updateAccountGroup` when an Account Group with the same name already exists for the Company (excluding the row being updated itself). Not explicit Ch.18 business-rule text — enforced here as a direct consequence of the same Repository-layer uniqueness reasoning as `DuplicateTaxGroupNameError`, mirroring its identical duplicate-name-within-company check. */
export class DuplicateAccountGroupNameError extends DomainError {
  constructor(public readonly companyUuid: string, public readonly accountGroupName: string) {
    super(`Account Group '${accountGroupName}' already exists for Company '${companyUuid}'.`);
  }
}

/** Raised by `createAccountGroup`/`updateAccountGroup` when a supplied parent Account Group's `accountType` does not equal the (new or existing) group's own `accountType` (00_BUSINESS_RULES.md Ch.18.7 AGP-003 — nesting must preserve a consistent classification down the tree). */
export class AccountGroupTypeMismatchError extends DomainError {
  constructor(
    public readonly parentAccountGroupUuid: string,
    public readonly parentAccountType: string,
    public readonly childAccountType: string,
  ) {
    super(
      `Account Group's accountType '${childAccountType}' must match its parent Account Group '${parentAccountGroupUuid}''s accountType '${parentAccountType}'.`,
    );
  }
}

/** Raised by `createAccount`/`updateAccount` when the target Account Group's `accountType` does not equal the Account's own `accountType` (00_BUSINESS_RULES.md Ch.18.7 AGP-002 — an Account Group's type must match every Account assigned to it). */
export class AccountGroupAssignmentTypeMismatchError extends DomainError {
  constructor(
    public readonly accountGroupUuid: string,
    public readonly accountGroupType: string,
    public readonly accountType: string,
  ) {
    super(
      `Account's accountType '${accountType}' must match Account Group '${accountGroupUuid}''s accountType '${accountGroupType}'.`,
    );
  }
}

/** Raised by `createAccount`/`updateAccount` when a supplied parent Account's `accountType` does not equal the child Account's own `accountType` (00_BUSINESS_RULES.md Ch.17.7 COA-002 — parent/child Accounts must share the same classification). */
export class AccountTypeMismatchError extends DomainError {
  constructor(
    public readonly parentAccountUuid: string,
    public readonly parentAccountType: string,
    public readonly childAccountType: string,
  ) {
    super(
      `Account's accountType '${childAccountType}' must match its parent Account '${parentAccountUuid}''s accountType '${parentAccountType}'.`,
    );
  }
}

/** Raised by `createAccount` when an Account with the same `code` already exists for the Company — regardless of that other Account's current status, including soft-deleted/deactivated (00_BUSINESS_RULES.md Ch.17.7 COA-004 — a `code` is a never-reused identity; `accounts.code` has no `deletedAt`-scoped uniqueness composite, a deliberate never-reuse decision mirroring `DuplicateCurrencyIsoCodeError`'s identical reasoning). */
export class DuplicateAccountCodeError extends DomainError {
  constructor(public readonly companyUuid: string, public readonly code: string) {
    super(`Account code '${code}' already exists for Company '${companyUuid}'.`);
  }
}

/** Raised by the General Ledger read model's `getAccountLedger`/`getLedger` use cases when a client-supplied `cursor` query param cannot be decoded into a well-formed `{entryDate, uuid}` position (07_REST_API_STANDARDS.md PAG-003 — "opaque... clients must not decode or construct cursors themselves"; this is the server rejecting a cursor it did not itself mint, not a business rule). */
export class InvalidLedgerCursorError extends DomainError {
  constructor(public readonly cursor: string) {
    super(`Ledger cursor '${cursor}' is not a valid cursor.`);
  }
}

/** Raised by the General Ledger read model when a supplied `dateFrom` is later than `dateTo` — the minimum structural invariant a date "range" implies, mirroring `InvalidTaxRuleEffectiveDateRangeError`'s identical reasoning (not literal Ch.19/24 text). */
export class InvalidLedgerDateRangeError extends DomainError {
  constructor(public readonly dateFrom: Date, public readonly dateTo: Date) {
    super(`Ledger dateFrom '${dateFrom.toISOString()}' must not be later than dateTo '${dateTo.toISOString()}'.`);
  }
}
