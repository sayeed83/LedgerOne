import { z } from "zod";

// VAL-001/VAL-004: convenience-only client validation (FP4) mirroring the
// backend's create-company.dto.ts/update-company.dto.ts wire shape.
export const companyFormSchema = z.object({
  companyCode: z.string().min(1, "Company code is required."),
  legalName: z.string().min(1, "Legal name is required."),
  displayName: z.string().optional(),
  legalEntityType: z.string().optional(),
  taxRegistrationNumber: z.string().min(1, "Tax registration number is required."),
  baseCurrencyCode: z
    .string()
    .length(3, "Currency code must be exactly 3 letters.")
    .regex(/^[A-Z]{3}$/, "Currency code must be 3 uppercase letters."),
  country: z.string().min(1, "Country is required."),
  timeZone: z.string().min(1, "Time zone is required."),
  financialYearStartMonth: z.coerce.number().int().min(1, "Enter 1-12.").max(12, "Enter 1-12."),
  financialYearStartDay: z.coerce.number().int().min(1, "Enter 1-31.").max(31, "Enter 1-31."),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;
