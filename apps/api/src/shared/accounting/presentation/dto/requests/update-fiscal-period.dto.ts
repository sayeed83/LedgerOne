import { z } from "zod";

// Status is never changed here (see soft-close/close/reopen-fiscal-period.controller.ts).
export const updateFiscalPeriodRequestSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type UpdateFiscalPeriodRequest = z.infer<typeof updateFiscalPeriodRequestSchema>;
