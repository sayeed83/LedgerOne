import { z } from "zod";

// Shared query-filter shape for both General Ledger read-model endpoints
// (`GET /ledger` and `GET /ledger/accounts/:accountUuid`) — 00_BUSINESS_RULES.md
// Ch.19.8's minimum filter set (Tenant via the header, Account, Company,
// Date Range) plus 07_REST_API_STANDARDS.md Ch.14's mandatory cursor
// pagination (`cursor`/`pageSize`, never `page`/`offset` — PAG-001/002).
// `pageSize` (not `limit`) is this endpoint's external query-param name per
// this milestone's explicit instruction; the Business layer's own input/
// output shape still uses `limit`, matching Ch.14.3's literal documented
// response shape (`meta.pagination.limit`) — this schema is where that one
// rename happens, and only here.
export const ledgerQueryFiltersSchema = z.object({
  companyUuid: z.string().uuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  cursor: z.string().min(1).optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});

export type LedgerQueryFilters = z.infer<typeof ledgerQueryFiltersSchema>;
