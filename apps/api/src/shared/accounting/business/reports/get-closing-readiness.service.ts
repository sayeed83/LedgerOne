// Business layer — Financial Closing (00_BUSINESS_RULES.md Ch.32),
// READ-ONLY per this epic's explicit scope: a closing-READINESS check, never
// a closing action itself (no posting/approving/closing endpoint exists
// anywhere in this file or its Presentation layer). CLS-001: closing cannot
// proceed while the Trial Balance does not balance — composes
// `get-trial-balance.service.ts` scoped to the Fiscal Period's own end date,
// never a second balance calculation. CLS-002: periods must be closed in
// strict chronological order — checked via the existing
// `listFiscalPeriods(tenantId, financialYearId)`, no new Repository method
// needed. CLS-003 (every constituent Fiscal Period Closed before year-end
// closing) and CLS-004 (Reopen routed through elevated approval) are
// deliberately out of scope — this endpoint answers "is THIS Fiscal Period
// ready to close", not "is the whole Financial Year ready", and reopening is
// a mutation this epic does not implement at all.
import { IAccountingRepository } from "../../domain/interfaces/accounting-repository.interface";
import { ILedgerRepository } from "../../domain/interfaces/ledger-repository.interface";
import { IClock } from "../../domain/interfaces/clock.interface";
import { FiscalPeriod } from "../../domain/aggregates/fiscal-period.aggregate";
import { FiscalPeriodStatus } from "../../domain/enums/fiscal-period-status.enum";
import { FiscalPeriodNotFoundError } from "../../domain/errors/accounting.errors";
import { getTrialBalance } from "./get-trial-balance.service";

export interface GetClosingReadinessInput {
  tenantId: bigint;
  companyUuid: string;
  fiscalPeriodUuid: string;
}

export interface GetClosingReadinessDeps {
  repository: IAccountingRepository;
  ledgerRepository: ILedgerRepository;
  clock: IClock;
}

export interface ClosingReadinessResult {
  fiscalPeriod: FiscalPeriod;
  trialBalanceBalanced: boolean;
  priorPeriodsClosed: boolean;
  readyToClose: boolean;
  reasons: string[];
}

export async function getClosingReadiness(input: GetClosingReadinessInput, deps: GetClosingReadinessDeps): Promise<ClosingReadinessResult> {
  const fiscalPeriod = await deps.repository.findFiscalPeriodByUuid(input.tenantId, input.fiscalPeriodUuid);
  if (!fiscalPeriod) {
    throw new FiscalPeriodNotFoundError(input.fiscalPeriodUuid);
  }

  // CLS-001: the Trial Balance as of this Fiscal Period's own end date must
  // balance. `includeZeroActivity`/pagination are irrelevant to the
  // balanced/unbalanced check (TRB-001 is a total, not a per-row property),
  // so only `isBalanced` is read from the composed result.
  const trialBalance = await getTrialBalance(
    { tenantId: input.tenantId, companyUuid: input.companyUuid, asOfDate: fiscalPeriod.endDate },
    { repository: deps.repository, ledgerRepository: deps.ledgerRepository, clock: deps.clock },
  );

  // CLS-002: every Fiscal Period within the same Financial Year that starts
  // strictly before this one must already be Closed.
  const siblingPeriods = await deps.repository.listFiscalPeriods(input.tenantId, fiscalPeriod.financialYearId);
  const priorPeriods = siblingPeriods.filter((period) => period.startDate.getTime() < fiscalPeriod.startDate.getTime());
  const priorPeriodsClosed = priorPeriods.every((period) => period.status === FiscalPeriodStatus.Closed);

  const reasons: string[] = [];
  if (!trialBalance.isBalanced) {
    reasons.push("Trial Balance does not balance as of this Fiscal Period's end date (CLS-001).");
  }
  if (!priorPeriodsClosed) {
    reasons.push("One or more prior Fiscal Periods in this Financial Year are not yet Closed (CLS-002).");
  }

  return {
    fiscalPeriod,
    trialBalanceBalanced: trialBalance.isBalanced,
    priorPeriodsClosed,
    readyToClose: trialBalance.isBalanced && priorPeriodsClosed,
    reasons,
  };
}
