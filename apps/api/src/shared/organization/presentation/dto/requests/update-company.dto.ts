import { z } from "zod";

export const updateCompanyRequestSchema = z.object({
  companyCode: z.string().min(1).optional(),
  legalName: z.string().min(1).optional(),
  displayName: z.string().min(1).nullable().optional(),
  legalEntityType: z.string().min(1).nullable().optional(),
  taxRegistrationNumber: z.string().min(1).optional(),
  baseCurrencyCode: z.string().length(3).optional(),
  country: z.string().min(1).optional(),
  timeZone: z.string().min(1).optional(),
  financialYearStartMonth: z.number().int().min(1).max(12).optional(),
  financialYearStartDay: z.number().int().min(1).max(31).optional(),
});

export type UpdateCompanyRequest = z.infer<typeof updateCompanyRequestSchema>;
