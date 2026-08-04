import { z } from "zod";
import { FinancialYearStatus } from "../../../business/accounting-types";

// Never the `FinancialYear` Domain aggregate itself (05_CODING_STANDARDS.md
// Ch.16.3) — a separate, flatter shape. Internal `id`/`tenantId`/
// `createdBy`/`updatedBy`/`deletedAt` are never serialized
// (06_DATABASE_STANDARDS.md PK-003) — only `uuid` (and the cross-module
// `companyUuid` reference) crosses the API boundary.
export const financialYearResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyUuid: z.string().uuid(),
  startDate: z.date(),
  endDate: z.date(),
  status: z.nativeEnum(FinancialYearStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type FinancialYearResponse = z.infer<typeof financialYearResponseSchema>;

/** Structural rather than importing the Domain `FinancialYear` type (Presentation must not import domain/, Ch.9.3). */
interface FinancialYearLike {
  uuid: string;
  companyUuid: string;
  startDate: Date;
  endDate: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toFinancialYearResponse(financialYear: FinancialYearLike): FinancialYearResponse {
  return {
    uuid: financialYear.uuid,
    companyUuid: financialYear.companyUuid,
    startDate: financialYear.startDate,
    endDate: financialYear.endDate,
    status: financialYear.status as FinancialYearStatus,
    createdAt: financialYear.createdAt,
    updatedAt: financialYear.updatedAt,
  };
}
