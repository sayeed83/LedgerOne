// Maps this module's Domain errors to the HTTP status/code pair
// (07_REST_API_STANDARDS.md §5.3/§9.4). The handbook's documented mechanism
// for this is a single centralized error-handling middleware
// (05_CODING_STANDARDS.md Ch.18.5/Ch.31.5) — out of scope for this task.
// Kept here as a plain function, called from each controller's own catch
// block, so the mapping table still lives in exactly one place rather than
// being duplicated per controller; this is an interim measure until the
// real centralized middleware exists.
import {
  DomainError,
  FinancialYearNotFoundError,
  InvalidFinancialYearStatusTransitionError,
  FinancialYearOverlapError,
  FinancialYearNotOpenError,
  FiscalPeriodNotFoundError,
  InvalidFiscalPeriodStatusTransitionError,
  FiscalPeriodOverlapError,
  FiscalPeriodClosedError,
  FiscalPeriodNotOpenError,
  CurrencyNotFoundError,
  InvalidCurrencyStatusTransitionError,
  DuplicateCurrencyIsoCodeError,
  CurrencyNotActiveError,
  ExchangeRateNotFoundError,
  ExchangeRateCurrencyPairNotDistinctError,
  InvalidExchangeRateValueError,
  DuplicateExchangeRateError,
  InvalidDecimalValueError,
  TaxGroupNotFoundError,
  DuplicateTaxGroupNameError,
  TaxRuleNotFoundError,
  TaxRuleOverlapError,
  InvalidTaxRuleEffectiveDateRangeError,
  InvalidTaxRateValueError,
  AccountGroupNotFoundError,
  DuplicateAccountGroupNameError,
  AccountGroupTypeMismatchError,
  AccountGroupAssignmentTypeMismatchError,
  AccountNotFoundError,
  InvalidAccountStatusTransitionError,
  AccountTypeMismatchError,
  DuplicateAccountCodeError,
  JournalEntryNotFoundError,
  InvalidJournalEntryStatusTransitionError,
  JournalEntryLineNotFoundError,
  LedgerEntryNotFoundError,
  DuplicateLedgerEntryForJournalEntryLineError,
  JournalEntryMinimumLinesError,
  JournalEntryMinimumDistinctAccountsError,
  InvalidJournalEntryLineAmountError,
  JournalEntryNotBalancedError,
  AccountNotActiveError,
  AccountNotPostableError,
  JournalEntryNotEditableError,
  NoFiscalPeriodForPostingDateError,
  InvalidLedgerCursorError,
  InvalidLedgerDateRangeError,
} from "../../business/accounting-errors";

export interface HttpErrorMapping {
  status: number;
  code: string;
}

export function mapDomainErrorToHttp(error: DomainError): HttpErrorMapping {
  if (error instanceof FinancialYearNotFoundError) {
    return { status: 404, code: "ACC_FINANCIAL_YEAR_NOT_FOUND" };
  }
  if (error instanceof InvalidFinancialYearStatusTransitionError) {
    return { status: 409, code: "ACC_INVALID_FINANCIAL_YEAR_STATUS_TRANSITION" };
  }
  if (error instanceof FinancialYearOverlapError) {
    return { status: 409, code: "ACC_FINANCIAL_YEAR_OVERLAP" };
  }
  if (error instanceof FinancialYearNotOpenError) {
    return { status: 403, code: "ACC_FINANCIAL_YEAR_NOT_OPEN" };
  }
  if (error instanceof FiscalPeriodNotFoundError) {
    return { status: 404, code: "ACC_FISCAL_PERIOD_NOT_FOUND" };
  }
  if (error instanceof InvalidFiscalPeriodStatusTransitionError) {
    return { status: 409, code: "ACC_INVALID_FISCAL_PERIOD_STATUS_TRANSITION" };
  }
  if (error instanceof FiscalPeriodOverlapError) {
    return { status: 409, code: "ACC_FISCAL_PERIOD_OVERLAP" };
  }
  if (error instanceof FiscalPeriodClosedError) {
    return { status: 409, code: "ACC_FISCAL_PERIOD_CLOSED" };
  }
  if (error instanceof FiscalPeriodNotOpenError) {
    return { status: 403, code: "ACC_FISCAL_PERIOD_NOT_OPEN" };
  }
  if (error instanceof CurrencyNotFoundError) {
    return { status: 404, code: "ACC_CURRENCY_NOT_FOUND" };
  }
  if (error instanceof InvalidCurrencyStatusTransitionError) {
    return { status: 409, code: "ACC_INVALID_CURRENCY_STATUS_TRANSITION" };
  }
  if (error instanceof DuplicateCurrencyIsoCodeError) {
    return { status: 409, code: "ACC_DUPLICATE_CURRENCY_ISO_CODE" };
  }
  if (error instanceof CurrencyNotActiveError) {
    return { status: 403, code: "ACC_CURRENCY_NOT_ACTIVE" };
  }
  if (error instanceof ExchangeRateNotFoundError) {
    return { status: 404, code: "ACC_EXCHANGE_RATE_NOT_FOUND" };
  }
  if (error instanceof ExchangeRateCurrencyPairNotDistinctError) {
    return { status: 422, code: "ACC_EXCHANGE_RATE_PAIR_NOT_DISTINCT" };
  }
  if (error instanceof InvalidExchangeRateValueError) {
    return { status: 422, code: "ACC_INVALID_EXCHANGE_RATE_VALUE" };
  }
  if (error instanceof DuplicateExchangeRateError) {
    return { status: 409, code: "ACC_DUPLICATE_EXCHANGE_RATE" };
  }
  if (error instanceof InvalidDecimalValueError) {
    return { status: 422, code: "ACC_INVALID_DECIMAL_VALUE" };
  }
  if (error instanceof TaxGroupNotFoundError) {
    return { status: 404, code: "ACC_TAX_GROUP_NOT_FOUND" };
  }
  if (error instanceof DuplicateTaxGroupNameError) {
    return { status: 409, code: "ACC_DUPLICATE_TAX_GROUP_NAME" };
  }
  if (error instanceof TaxRuleNotFoundError) {
    return { status: 404, code: "ACC_TAX_RULE_NOT_FOUND" };
  }
  if (error instanceof TaxRuleOverlapError) {
    return { status: 409, code: "ACC_TAX_RULE_OVERLAP" };
  }
  if (error instanceof InvalidTaxRuleEffectiveDateRangeError) {
    return { status: 422, code: "ACC_INVALID_TAX_RULE_EFFECTIVE_DATE_RANGE" };
  }
  if (error instanceof InvalidTaxRateValueError) {
    return { status: 422, code: "ACC_INVALID_TAX_RATE_VALUE" };
  }
  if (error instanceof AccountGroupNotFoundError) {
    return { status: 404, code: "ACC_ACCOUNT_GROUP_NOT_FOUND" };
  }
  if (error instanceof DuplicateAccountGroupNameError) {
    return { status: 409, code: "ACC_DUPLICATE_ACCOUNT_GROUP_NAME" };
  }
  if (error instanceof AccountGroupTypeMismatchError) {
    return { status: 422, code: "ACC_ACCOUNT_GROUP_TYPE_MISMATCH" };
  }
  if (error instanceof AccountGroupAssignmentTypeMismatchError) {
    return { status: 422, code: "ACC_ACCOUNT_GROUP_ASSIGNMENT_TYPE_MISMATCH" };
  }
  if (error instanceof AccountNotFoundError) {
    return { status: 404, code: "ACC_ACCOUNT_NOT_FOUND" };
  }
  if (error instanceof InvalidAccountStatusTransitionError) {
    return { status: 409, code: "ACC_INVALID_ACCOUNT_STATUS_TRANSITION" };
  }
  if (error instanceof AccountTypeMismatchError) {
    return { status: 422, code: "ACC_ACCOUNT_TYPE_MISMATCH" };
  }
  if (error instanceof DuplicateAccountCodeError) {
    return { status: 409, code: "ACC_DUPLICATE_ACCOUNT_CODE" };
  }
  if (error instanceof JournalEntryNotFoundError) {
    return { status: 404, code: "ACC_JOURNAL_ENTRY_NOT_FOUND" };
  }
  if (error instanceof InvalidJournalEntryStatusTransitionError) {
    return { status: 409, code: "ACC_INVALID_JOURNAL_ENTRY_STATUS_TRANSITION" };
  }
  if (error instanceof JournalEntryLineNotFoundError) {
    return { status: 404, code: "ACC_JOURNAL_ENTRY_LINE_NOT_FOUND" };
  }
  if (error instanceof LedgerEntryNotFoundError) {
    return { status: 404, code: "ACC_LEDGER_ENTRY_NOT_FOUND" };
  }
  if (error instanceof DuplicateLedgerEntryForJournalEntryLineError) {
    return { status: 409, code: "ACC_DUPLICATE_LEDGER_ENTRY_FOR_LINE" };
  }
  if (error instanceof JournalEntryMinimumLinesError) {
    return { status: 422, code: "ACC_JOURNAL_ENTRY_MINIMUM_LINES" };
  }
  if (error instanceof JournalEntryMinimumDistinctAccountsError) {
    return { status: 422, code: "ACC_JOURNAL_ENTRY_MINIMUM_DISTINCT_ACCOUNTS" };
  }
  if (error instanceof InvalidJournalEntryLineAmountError) {
    return { status: 422, code: "ACC_INVALID_JOURNAL_ENTRY_LINE_AMOUNT" };
  }
  if (error instanceof JournalEntryNotBalancedError) {
    return { status: 422, code: "ACC_JOURNAL_ENTRY_NOT_BALANCED" };
  }
  if (error instanceof AccountNotActiveError) {
    return { status: 403, code: "ACC_ACCOUNT_NOT_ACTIVE" };
  }
  if (error instanceof AccountNotPostableError) {
    return { status: 422, code: "ACC_ACCOUNT_NOT_POSTABLE" };
  }
  if (error instanceof JournalEntryNotEditableError) {
    return { status: 409, code: "ACC_JOURNAL_ENTRY_NOT_EDITABLE" };
  }
  if (error instanceof NoFiscalPeriodForPostingDateError) {
    return { status: 422, code: "ACC_NO_FISCAL_PERIOD_FOR_POSTING_DATE" };
  }
  if (error instanceof InvalidLedgerCursorError) {
    return { status: 422, code: "ACC_INVALID_LEDGER_CURSOR" };
  }
  if (error instanceof InvalidLedgerDateRangeError) {
    return { status: 422, code: "ACC_INVALID_LEDGER_DATE_RANGE" };
  }
  // Per 07_REST_API_STANDARDS.md §9.4's default for module-specific business
  // errors not individually listed.
  return { status: 422, code: "ACC_DOMAIN_ERROR" };
}
