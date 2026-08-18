import { z } from "zod";
import { isoDateSchema, uuidSchema } from "./shared.schema";

// VAL-001/002: mirrors create-financial-year.dto.ts/update-financial-year.dto.ts.
export const financialYearFormSchema = z.object({
  companyUuid: uuidSchema,
  startDate: isoDateSchema,
  endDate: isoDateSchema,
});

export type FinancialYearFormValues = z.infer<typeof financialYearFormSchema>;
