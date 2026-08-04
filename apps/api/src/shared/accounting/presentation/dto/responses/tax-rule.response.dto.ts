import { z } from "zod";

// Never the `TaxRule` Domain entity itself (05_CODING_STANDARDS.md
// Ch.16.3). Internal `id`/`tenantId`/`createdBy`/`updatedBy`/`deletedAt` are
// never serialized (06_DATABASE_STANDARDS.md PK-003) — that includes
// `taxGroupId`, the entity's own internal in-module FK, which is
// DELIBERATELY OMITTED here rather than resolved to its Tax Group `uuid`,
// mirroring Exchange Rate's own documented choice to omit
// `fromCurrencyId`/`toCurrencyId` rather than pay an extra lookup per row
// (exchange-rate.response.dto.ts's own comment) — flagged as a Handbook
// Deviation/known gap, not silently dropped. `rate` is a Domain
// `DecimalValue`; its own `toString()` is the API-facing decimal string.
export const taxRuleResponseSchema = z.object({
  uuid: z.string().uuid(),
  rate: z.string(),
  effectiveFrom: z.date(),
  effectiveTo: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TaxRuleResponse = z.infer<typeof taxRuleResponseSchema>;

/** Structural rather than importing the Domain `TaxRule` type (Presentation must not import domain/, Ch.9.3). `rate` is duck-typed to just the `toString()` a `DecimalValue` provides, avoiding a Domain import for the type alone. */
interface TaxRuleLike {
  uuid: string;
  rate: { toString(): string };
  effectiveFrom: Date;
  effectiveTo: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toTaxRuleResponse(taxRule: TaxRuleLike): TaxRuleResponse {
  return {
    uuid: taxRule.uuid,
    rate: taxRule.rate.toString(),
    effectiveFrom: taxRule.effectiveFrom,
    effectiveTo: taxRule.effectiveTo,
    createdAt: taxRule.createdAt,
    updatedAt: taxRule.updatedAt,
  };
}
