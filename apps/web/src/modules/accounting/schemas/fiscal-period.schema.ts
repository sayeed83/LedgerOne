import { z } from "zod";
import { isoDateSchema, uuidSchema } from "./shared.schema";

export const fiscalPeriodFormSchema = z.object({
  financialYearUuid: uuidSchema,
  startDate: isoDateSchema,
  endDate: isoDateSchema,
});

export type FiscalPeriodFormValues = z.infer<typeof fiscalPeriodFormSchema>;
