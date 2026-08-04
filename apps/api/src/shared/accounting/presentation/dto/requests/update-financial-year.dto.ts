import { z } from "zod";

// Status is never changed here (see open/close/reopen-financial-year.controller.ts).
export const updateFinancialYearRequestSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type UpdateFinancialYearRequest = z.infer<typeof updateFinancialYearRequestSchema>;
