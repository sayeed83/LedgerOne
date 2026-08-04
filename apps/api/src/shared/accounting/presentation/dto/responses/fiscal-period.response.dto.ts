import { z } from "zod";
import { FiscalPeriodStatus } from "../../../business/accounting-types";

// Never the `FiscalPeriod` Domain aggregate itself (05_CODING_STANDARDS.md
// Ch.16.3) — a separate, flatter shape. Internal `id`/`tenantId`/
// `createdBy`/`updatedBy`/`deletedAt` are never serialized
// (06_DATABASE_STANDARDS.md PK-003) — only `uuid` (and the cross-module
// `companyUuid` reference) crosses the API boundary, mirroring
// financial-year.response.dto.ts exactly. `financialYearId` is likewise
// never serialized: it is an in-module internal `id` (PK-003 applies to any
// internal identifier, not only the entity's own primary key), and this
// aggregate holds no corresponding `financialYearUuid` field to expose
// instead — resolving one would require an extra Financial Year lookup per
// row, out of scope for this milestone (flagged, not silently dropped).
export const fiscalPeriodResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.nativeEnum(FiscalPeriodStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FiscalPeriodResponse = z.infer<typeof fiscalPeriodResponseSchema>;

/** Structural rather than importing the Domain `FiscalPeriod` type (Presentation must not import domain/, Ch.9.3). */
interface FiscalPeriodLike {
  uuid: string;
  companyUuid: string;
  startDate: Date;
  endDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toFiscalPeriodResponse(fiscalPeriod: FiscalPeriodLike): FiscalPeriodResponse {
  return {
    uuid: fiscalPeriod.uuid,
    companyUuid: fiscalPeriod.companyUuid,
    startDate: fiscalPeriod.startDate,
    endDate: fiscalPeriod.endDate,
    status: fiscalPeriod.status as FiscalPeriodStatus,
    createdAt: fiscalPeriod.createdAt,
    updatedAt: fiscalPeriod.updatedAt,
  };
}
