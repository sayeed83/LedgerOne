import { z } from "zod";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Tax-Rule-specific data), mirroring create-exchange-rate.dto.ts.
// `taxGroupUuid` is the external Tax Group identifier
// (06_DATABASE_STANDARDS.md PK-003), resolved to its internal id by the
// Business layer. `rate` is validated only for non-empty shape here
// (`min(1)`) — the actual "is this a well-formed decimal"/"must be
// non-negative" invariants are enforced once, by the Domain layer
// (`DecimalValue.create`/`isNegative`, 05_CODING_STANDARDS.md Ch.15.4),
// mirroring create-exchange-rate.dto.ts's identical reasoning.
// `effectiveFrom`/`effectiveTo` arrive as ISO date strings over JSON and
// are coerced to `Date` (00_BUSINESS_RULES.md Ch.68.7).
export const createTaxRuleRequestSchema = z.object({
  taxGroupUuid: z.string().uuid(),
  rate: z.string().min(1),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional(),
});

export type CreateTaxRuleRequest = z.infer<typeof createTaxRuleRequestSchema>;
