import { z } from "zod";
import { reportCompanyShape, reportPointInTimeScopeShape } from "./report-scope-query.dto";

export const balanceSheetQuerySchema = z.object({
  ...reportCompanyShape,
  ...reportPointInTimeScopeShape,
});

export type BalanceSheetQuery = z.infer<typeof balanceSheetQuerySchema>;
