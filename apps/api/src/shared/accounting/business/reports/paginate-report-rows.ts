// Shared cursor pagination (07_REST_API_STANDARDS.md PAG-001..005) over an
// already-computed report row array — mirrors `ledger-cursor.ts`'s opaque
// base64url cursor pattern, but over an in-memory, `accountCode`-sorted
// array rather than a DB keyset query, since a report's rows are already
// fully materialized by `aggregate-account-balances.service.ts` in one call.
// Used by Trial Balance (Ch.24) — the one report whose row count scales with
// the full Chart of Accounts; P&L/Balance Sheet/Cash Flow return their
// (much smaller, grouped) sections in full, a deliberate scope decision
// documented in each of those services' own header comments.
import { InvalidReportCursorError } from "../../domain/errors/accounting.errors";

const DEFAULT_LIMIT = 25; // 07_REST_API_STANDARDS.md PAG-004
const MAX_LIMIT = 100; // 07_REST_API_STANDARDS.md PAG-004

export function clampReportLimit(limit: number | undefined): number {
  if (limit === undefined || limit < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(limit, MAX_LIMIT);
}

export function encodeReportRowCursor(code: string): string {
  return Buffer.from(code, "utf8").toString("base64url");
}

/** Throws `InvalidReportCursorError` for anything that isn't a well-formed, non-empty account code — a malformed/tampered/foreign cursor, never a business-rule condition. */
export function decodeReportRowCursor(raw: string): string {
  try {
    const code = Buffer.from(raw, "base64url").toString("utf8");
    if (!code) {
      throw new Error("cursor payload is empty");
    }
    return code;
  } catch {
    throw new InvalidReportCursorError(raw);
  }
}

export interface PaginatedReportRows<T> {
  page: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Sorts `rows` by `getCode` ascending, resumes strictly after `cursor` (exclusive) when supplied, and returns up to `limit` rows plus the standard `nextCursor`/`hasMore` pagination metadata (07_REST_API_STANDARDS.md Ch.14.3). */
export function paginateReportRows<T>(rows: T[], getCode: (row: T) => string, cursor: string | undefined, limit: number): PaginatedReportRows<T> {
  const sorted = [...rows].sort((a, b) => getCode(a).localeCompare(getCode(b)));
  let startIndex = 0;
  if (cursor) {
    const afterCode = decodeReportRowCursor(cursor);
    const foundIndex = sorted.findIndex((row) => getCode(row) > afterCode);
    startIndex = foundIndex === -1 ? sorted.length : foundIndex;
  }
  const window = sorted.slice(startIndex, startIndex + limit + 1);
  const hasMore = window.length > limit;
  const page = hasMore ? window.slice(0, limit) : window;
  const lastRow = page[page.length - 1];
  const nextCursor = hasMore && lastRow ? encodeReportRowCursor(getCode(lastRow)) : null;
  return { page, nextCursor, hasMore };
}
