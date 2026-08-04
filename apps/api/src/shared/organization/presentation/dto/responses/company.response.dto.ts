import { z } from "zod";
import { CompanyStatus } from "../../../business/organization-types";

// Never the `Company` Domain aggregate itself (05_CODING_STANDARDS.md
// Ch.16.3) — a separate, flatter shape. Internal `id`/`tenantId`/
// `createdBy`/`updatedBy`/`deletedAt` are never serialized
// (06_DATABASE_STANDARDS.md PK-003).
export const companyResponseSchema = z.object({
  uuid: z.string().uuid(),
  companyCode: z.string(),
  legalName: z.string(),
  displayName: z.string().nullable(),
  legalEntityType: z.string().nullable(),
  taxRegistrationNumber: z.string(),
  baseCurrencyCode: z.string(),
  country: z.string(),
  timeZone: z.string(),
  financialYearStartMonth: z.number(),
  financialYearStartDay: z.number(),
  status: z.nativeEnum(CompanyStatus),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CompanyResponse = z.infer<typeof companyResponseSchema>;

/** Structural rather than importing the Domain `Company` type (Presentation must not import domain/, Ch.9.3). */
interface CompanyLike {
  uuid: string;
  companyCode: string;
  legalName: string;
  displayName: string | null;
  legalEntityType: string | null;
  taxRegistrationNumber: string;
  baseCurrencyCode: string;
  country: string;
  timeZone: string;
  financialYearStartMonth: number;
  financialYearStartDay: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export function toCompanyResponse(company: CompanyLike): CompanyResponse {
  return {
    uuid: company.uuid,
    companyCode: company.companyCode,
    legalName: company.legalName,
    displayName: company.displayName,
    legalEntityType: company.legalEntityType,
    taxRegistrationNumber: company.taxRegistrationNumber,
    baseCurrencyCode: company.baseCurrencyCode,
    country: company.country,
    timeZone: company.timeZone,
    financialYearStartMonth: company.financialYearStartMonth,
    financialYearStartDay: company.financialYearStartDay,
    status: company.status as CompanyStatus,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}
