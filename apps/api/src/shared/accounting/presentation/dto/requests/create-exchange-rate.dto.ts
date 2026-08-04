import { z } from "zod";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Exchange-Rate-specific data), mirroring create-financial-year.dto.ts.
// `fromCurrencyUuid`/`toCurrencyUuid` are external Currency identifiers
// (06_DATABASE_STANDARDS.md PK-003) resolved to internal ids by the
// Business layer, never the raw `id` itself. `rate` is validated only for
// non-empty shape here (`min(1)`) — the actual "is this a well-formed
// decimal" invariant, and the "must be positive" business rule
// (00_BUSINESS_RULES.md Ch.31.8), are both enforced once, by the Domain
// layer (`DecimalValue.create`/`isPositive`, 05_CODING_STANDARDS.md Ch.15.4
// — enforced by the object itself), not duplicated here as a second,
// possibly-inconsistent regex (Ch.17.3 — validate once, at the boundary
// that actually owns the invariant). `effectiveDate` arrives as an ISO date
// string over JSON and is coerced to `Date` (Ch.31.1).
export const createExchangeRateRequestSchema = z.object({
  fromCurrencyUuid: z.string().uuid(),
  toCurrencyUuid: z.string().uuid(),
  rate: z.string().min(1),
  effectiveDate: z.coerce.date(),
});

export type CreateExchangeRateRequest = z.infer<typeof createExchangeRateRequestSchema>;
