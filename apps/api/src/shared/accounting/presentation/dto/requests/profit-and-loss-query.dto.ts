import { z } from "zod";
import { reportCompanyShape, reportPeriodScopeShape } from "./report-scope-query.dto";

export const profitAndLossQuerySchema = z.object({
  ...reportCompanyShape,
  ...reportPeriodScopeShape,
});

export type ProfitAndLossQuery = z.infer<typeof profitAndLossQuerySchema>;
