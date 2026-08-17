import { z } from "zod";
import { FiscalPeriodStatus } from "../../../business/accounting-types";

// Financial Closing (00_BUSINESS_RULES.md Ch.32), read-only closing-readiness
// check — no posting/approving/closing action anywhere in this epic. Never
// serializes the Fiscal Period's internal `id`/`tenantId`/`financialYearId`
// (PK-003) — only its own `uuid` and the fields a caller needs to decide
// whether to proceed with closing.
export const closingReadinessResponseSchema = z.object({
  fiscalPeriod: z.object({
    uuid: z.string().uuid(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.nativeEnum(FiscalPeriodStatus),
  }),
  trialBalanceBalanced: z.boolean(),
  priorPeriodsClosed: z.boolean(),
  readyToClose: z.boolean(),
  reasons: z.array(z.string()),
});

export type ClosingReadinessResponse = z.infer<typeof closingReadinessResponseSchema>;

interface ClosingReadinessResultLike {
  fiscalPeriod: { uuid: string; startDate: Date; endDate: Date; status: FiscalPeriodStatus };
  trialBalanceBalanced: boolean;
  priorPeriodsClosed: boolean;
  readyToClose: boolean;
  reasons: string[];
}

export function toClosingReadinessResponse(result: ClosingReadinessResultLike): ClosingReadinessResponse {
  return {
    fiscalPeriod: {
      uuid: result.fiscalPeriod.uuid,
      startDate: result.fiscalPeriod.startDate.toISOString(),
      endDate: result.fiscalPeriod.endDate.toISOString(),
      status: result.fiscalPeriod.status,
    },
    trialBalanceBalanced: result.trialBalanceBalanced,
    priorPeriodsClosed: result.priorPeriodsClosed,
    readyToClose: result.readyToClose,
    reasons: result.reasons,
  };
}
