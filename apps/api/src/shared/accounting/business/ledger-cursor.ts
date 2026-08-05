// Opaque cursor codec for the General Ledger read model's keyset pagination
// (07_REST_API_STANDARDS.md PAG-003 — "the cursor is an opaque, encoded
// token... clients must not decode or construct cursors themselves"). Not a
// `.service.ts` use case (no Repository dependency, no `deps` object) — a
// small, framework-agnostic helper, mirroring `system-clock.ts`'s own
// precedent for a flat, non-use-case business file.
//
// Canonical Ledger ordering (00_BUSINESS_RULES.md Ch.19.6 — "chronological...
// running balance recalculated") is `entryDate` ascending, with `uuid`
// ascending as the stable tie-breaker for entries sharing an identical
// `entryDate` (every line of one multi-line Journal Entry posts with the
// same `entryDate`) — `uuid` is globally unique (06_DATABASE_STANDARDS.md
// PK-002), so `(entryDate, uuid)` is a total, deterministic order that never
// skips or duplicates a row across pages. This file encodes exactly that
// pair, per 07_REST_API_STANDARDS.md Ch.14.5's own worked example: "encode
// the cursor as a base64 JSON blob of the sort key(s) actually used by the
// underlying keyset query."
import { InvalidLedgerCursorError } from "../domain/errors/accounting.errors";
import { LedgerEntryPosition } from "../domain/interfaces/ledger-repository.interface";

export function encodeLedgerCursor(position: Required<LedgerEntryPosition>): string {
  const payload = JSON.stringify({ entryDate: position.entryDate.toISOString(), uuid: position.uuid });
  return Buffer.from(payload, "utf8").toString("base64url");
}

/** Throws `InvalidLedgerCursorError` for anything that isn't a well-formed `{entryDate, uuid}` position — a malformed/tampered/foreign cursor, never a business-rule condition. */
export function decodeLedgerCursor(raw: string): Required<LedgerEntryPosition> {
  try {
    const decoded: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof decoded !== "object" || decoded === null) {
      throw new Error("cursor payload is not an object");
    }
    const { entryDate: entryDateRaw, uuid } = decoded as Record<string, unknown>;
    const entryDate = typeof entryDateRaw === "string" ? new Date(entryDateRaw) : null;
    if (!entryDate || Number.isNaN(entryDate.getTime()) || typeof uuid !== "string" || uuid.length === 0) {
      throw new Error("cursor payload is malformed");
    }
    return { entryDate, uuid };
  } catch {
    throw new InvalidLedgerCursorError(raw);
  }
}
