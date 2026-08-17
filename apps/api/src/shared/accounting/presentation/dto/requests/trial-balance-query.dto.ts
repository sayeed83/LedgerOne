import { z } from "zod";
import { reportCompanyShape, reportPointInTimeScopeShape, reportPaginationShape } from "./report-scope-query.dto";

export const trialBalanceQuerySchema = z.object({
  ...reportCompanyShape,
  ...reportPointInTimeScopeShape,
  ...reportPaginationShape,
  includeZeroActivity: z.coerce.boolean().optional(),
});

export type TrialBalanceQuery = z.infer<typeof trialBalanceQuerySchema>;
