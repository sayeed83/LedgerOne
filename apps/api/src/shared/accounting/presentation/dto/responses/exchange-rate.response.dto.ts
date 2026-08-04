import { z } from "zod";

// Never the `ExchangeRate` Domain entity itself (05_CODING_STANDARDS.md
// Ch.16.3). Internal `id`/`tenantId`/`createdBy`/`updatedBy`/`deletedAt` are
// never serialized (06_DATABASE_STANDARDS.md PK-003) — that includes
// `fromCurrencyId`/`toCurrencyId`, the entity's own internal in-module FKs,
// which are DELIBERATELY OMITTED here rather than resolved to their
// Currency `uuid`s, mirroring Fiscal Period's own documented choice to omit
// `financialYearId` from its response DTO rather than pay an extra lookup
// per row (fiscal-period.response.dto.ts's own comment) — flagged as a
// Handbook Deviation/known gap, not silently dropped. `rate` is a Domain
// `DecimalValue`; its own `toString()` is the API-facing decimal string.
export const exchangeRateResponseSchema = z.object({
  uuid: z.string().uuid(),
  rate: z.string(),
  effectiveDate: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ExchangeRateResponse = z.infer<typeof exchangeRateResponseSchema>;

/** Structural rather than importing the Domain `ExchangeRate` type (Presentation must not import domain/, Ch.9.3). `rate` is duck-typed to just the `toString()` a `DecimalValue` provides, avoiding a Domain import for the type alone. */
interface ExchangeRateLike {
  uuid: string;
  rate: { toString(): string };
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function toExchangeRateResponse(exchangeRate: ExchangeRateLike): ExchangeRateResponse {
  return {
    uuid: exchangeRate.uuid,
    rate: exchangeRate.rate.toString(),
    effectiveDate: exchangeRate.effectiveDate,
    createdAt: exchangeRate.createdAt,
    updatedAt: exchangeRate.updatedAt,
  };
}
