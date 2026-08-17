import { z } from "zod";

// Shared query-param shape for the Financial Reporting engine's endpoints
// (Trial Balance Ch.24, P&L Ch.25, Balance Sheet Ch.26, Cash Flow Ch.27,
// Closing-Readiness Ch.32) — `companyUuid` (required; these reports are
// always scoped to one Company's Chart of Accounts), plus the shared
// "date filtering, Financial Year filtering, Fiscal Period filtering" set
// `resolve-report-scope.service.ts` resolves. Not every report accepts every
// field (a point-in-time report has no `dateFrom`; a period report has no
// `asOfDate`) — each report's own query schema below composes only the
// pieces it needs from this shape, mirroring `ledgerQueryFiltersSchema`'s
// own shared-shape precedent.
export const reportCompanyShape = {
  companyUuid: z.string().uuid(),
};

export const reportPointInTimeScopeShape = {
  asOfDate: z.coerce.date().optional(),
  fiscalPeriodUuid: z.string().uuid().optional(),
  financialYearUuid: z.string().uuid().optional(),
};

export const reportPeriodScopeShape = {
  fiscalPeriodUuid: z.string().uuid().optional(),
  financialYearUuid: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
};

/** Cursor pagination (PAG-001..005), reused only by reports that expose a paginated row list (Trial Balance today). */
export const reportPaginationShape = {
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().optional(),
};
