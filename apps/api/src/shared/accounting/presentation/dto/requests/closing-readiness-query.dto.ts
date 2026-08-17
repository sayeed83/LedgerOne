import { z } from "zod";
import { reportCompanyShape } from "./report-scope-query.dto";

export const closingReadinessQuerySchema = z.object({
  ...reportCompanyShape,
  fiscalPeriodUuid: z.string().uuid(),
});

export type ClosingReadinessQuery = z.infer<typeof closingReadinessQuerySchema>;
