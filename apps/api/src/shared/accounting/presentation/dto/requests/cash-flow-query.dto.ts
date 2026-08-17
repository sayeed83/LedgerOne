import { z } from "zod";
import { reportCompanyShape, reportPeriodScopeShape } from "./report-scope-query.dto";

export const cashFlowQuerySchema = z.object({
  ...reportCompanyShape,
  ...reportPeriodScopeShape,
});

export type CashFlowQuery = z.infer<typeof cashFlowQuerySchema>;
