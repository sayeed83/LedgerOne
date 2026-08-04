import { z } from "zod";
import { CurrencyStatus } from "../../../business/accounting-types";

// Never the `Currency` Domain aggregate itself (05_CODING_STANDARDS.md
// Ch.16.3) — a separate, flatter shape. Currency has no `tenantId`/
// `createdBy`/`updatedBy` at all (platform-owned reference data,
// 06_DATABASE_STANDARDS.md MT-005) and internal `id`/`deletedAt` are never
// serialized regardless (PK-003) — only `uuid` and business fields cross
// the API boundary.
export const currencyResponseSchema = z.object({
  uuid: z.string().uuid(),
  isoCode: z.string(),
  name: z.string(),
  symbol: z.string(),
  decimalPrecision: z.number().int(),
  status: z.nativeEnum(CurrencyStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CurrencyResponse = z.infer<typeof currencyResponseSchema>;

/** Structural rather than importing the Domain `Currency` type (Presentation must not import domain/, Ch.9.3). */
interface CurrencyLike {
  uuid: string;
  isoCode: string;
  name: string;
  symbol: string;
  decimalPrecision: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toCurrencyResponse(currency: CurrencyLike): CurrencyResponse {
  return {
    uuid: currency.uuid,
    isoCode: currency.isoCode,
    name: currency.name,
    symbol: currency.symbol,
    decimalPrecision: currency.decimalPrecision,
    status: currency.status as CurrencyStatus,
    createdAt: currency.createdAt,
    updatedAt: currency.updatedAt,
  };
}
