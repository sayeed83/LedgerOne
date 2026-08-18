import { z } from "zod";

// Never the `Unit` Domain entity itself (05_CODING_STANDARDS.md Ch.16.3) —
// a separate, flatter shape. Internal `id`/`tenantId`/`createdBy`/
// `updatedBy`/`deletedAt` are never serialized (06_DATABASE_STANDARDS.md
// PK-003) — only `uuid` (and the cross-module `companyUuid` reference)
// cross the API boundary. `baseUnitId` is DELIBERATELY OMITTED entirely
// rather than resolved to the base Unit's own `uuid` — mirroring Product
// Category's own carried-forward Handbook Deviation on
// `parentProductCategoryId` (an extra lookup per row, not paid), itself
// carried forward from Account Group's/Tax Rule's/Exchange Rate's
// identical reasoning. `conversionFactor` is serialized as-is (already a
// plain string at the Domain layer, not an internal id — no PK-003
// concern).
export const unitResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  name: z.string(),
  symbol: z.string(),
  conversionFactor: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UnitResponse = z.infer<typeof unitResponseSchema>;

/** Structural rather than importing the Domain `Unit` type (Presentation must not import domain/, Ch.9.3). */
interface UnitLike {
  uuid: string;
  companyUuid: string;
  name: string;
  symbol: string;
  conversionFactor: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toUnitResponse(unit: UnitLike): UnitResponse {
  return {
    uuid: unit.uuid,
    companyUuid: unit.companyUuid,
    name: unit.name,
    symbol: unit.symbol,
    conversionFactor: unit.conversionFactor,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
  };
}
