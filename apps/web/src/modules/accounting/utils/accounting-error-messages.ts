import type { ApiError } from "@/services/api-client";

// ERR-002/003: known Accounting error codes (mirroring the backend's own
// domain-error-http-mapping.ts) map to specific, actionable copy; anything
// unmapped falls back to a safe generic message — never the raw server
// exception text, mirroring Organization's own error-message module.
const ACCOUNTING_ERROR_MESSAGES: Record<string, string> = {
  ACC_FINANCIAL_YEAR_NOT_FOUND: "This Financial Year could not be found. It may have been removed.",
  ACC_FISCAL_PERIOD_NOT_FOUND: "This Fiscal Period could not be found. It may have been removed.",
  ACC_CURRENCY_NOT_FOUND: "This Currency could not be found. It may have been removed.",
  ACC_EXCHANGE_RATE_NOT_FOUND: "This Exchange Rate could not be found. It may have been removed.",
  ACC_TAX_GROUP_NOT_FOUND: "This Tax Group could not be found. It may have been removed.",
  ACC_TAX_RULE_NOT_FOUND: "This Tax Rule could not be found. It may have been removed.",
  ACC_ACCOUNT_GROUP_NOT_FOUND: "This Account Group could not be found. It may have been removed.",
  ACC_ACCOUNT_NOT_FOUND: "This Account could not be found. It may have been removed.",
  ACC_JOURNAL_ENTRY_NOT_FOUND: "This Journal Entry could not be found. It may have been removed.",
  ACC_INVALID_FINANCIAL_YEAR_STATUS_TRANSITION: "That status change isn't allowed from this Financial Year's current status.",
  ACC_INVALID_FISCAL_PERIOD_STATUS_TRANSITION: "That status change isn't allowed from this Fiscal Period's current status.",
  ACC_INVALID_JOURNAL_ENTRY_STATUS_TRANSITION: "That action isn't allowed from this Journal Entry's current status.",
  ACC_FINANCIAL_YEAR_OVERLAP: "This Financial Year's dates overlap with another Financial Year for this Company.",
  ACC_FISCAL_PERIOD_OVERLAP: "This Fiscal Period's dates overlap with another Fiscal Period in this Financial Year.",
  ACC_TAX_RULE_OVERLAP: "This Tax Rule's effective dates overlap with another rule in this Tax Group.",
  ACC_FINANCIAL_YEAR_NOT_OPEN: "This action requires the Financial Year to be Open.",
  ACC_FISCAL_PERIOD_NOT_OPEN: "This action requires the Fiscal Period to be Open.",
  ACC_FISCAL_PERIOD_CLOSED: "A Closed Fiscal Period cannot be modified.",
  ACC_DUPLICATE_CURRENCY_ISO_CODE: "A Currency with this ISO code already exists.",
  ACC_DUPLICATE_ACCOUNT_CODE: "An Account with this code already exists for this Company.",
  ACC_EXCHANGE_RATE_PAIR_NOT_DISTINCT: "The From and To currencies must be different.",
  ACC_JOURNAL_ENTRY_NOT_BALANCED: "Total debits and total credits must be equal before this entry can be saved.",
  ACC_INVALID_LEDGER_CURSOR: "This ledger page reference is no longer valid — reload and try again.",
  ACC_DOMAIN_ERROR: "Please check the highlighted fields and try again.",
  VALIDATION_ERROR: "Please check the highlighted fields and try again.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection and try again.",
};

export function getAccountingErrorMessage(error: ApiError | null | undefined): string | undefined {
  if (!error) {
    return undefined;
  }
  return ACCOUNTING_ERROR_MESSAGES[error.code] ?? "Something went wrong. Please try again.";
}
