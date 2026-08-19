import type { ApiError } from "@/services/api-client";

// ERR-002/003: known error codes the Financial Reporting engine's own
// endpoints can return (mirroring the backend's own Accounting
// domain-error-http-mapping.ts) map to specific, actionable copy; anything
// unmapped falls back to a safe generic message. Duplicated rather than
// imported from Accounting's own `accounting-error-messages.ts` — every
// module keeps its own copy of this pattern (mirrors
// `use-companies-for-select.ts`'s own cross-module duplication precedent).
const REPORTING_ERROR_MESSAGES: Record<string, string> = {
  ACC_FISCAL_PERIOD_NOT_FOUND: "This Fiscal Period could not be found. It may have been removed.",
  ACC_FINANCIAL_YEAR_NOT_FOUND: "This Financial Year could not be found. It may have been removed.",
  ACC_REPORT_SCOPE_REQUIRED: "Select a Fiscal Period, a Financial Year, or a date range before running this report.",
  ACC_INVALID_REPORT_DATE_RANGE: "The date range is invalid — the end date must be on or after the start date.",
  ACC_INVALID_REPORT_CURSOR: "This report page reference is no longer valid — reload and try again.",
  ACC_DOMAIN_ERROR: "Please check the highlighted fields and try again.",
  VALIDATION_ERROR: "Please check the highlighted fields and try again.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection and try again.",
};

export function getReportingErrorMessage(error: ApiError | null | undefined): string | undefined {
  if (!error) {
    return undefined;
  }
  return REPORTING_ERROR_MESSAGES[error.code] ?? "Something went wrong. Please try again.";
}
