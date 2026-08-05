import { reverseJournalEntry, ReverseJournalEntryDeps } from "./reverse-journal-entry.service";
import { JournalEntryNotFoundError, InvalidJournalEntryStatusTransitionError } from "../domain/errors/accounting.errors";
import { JournalEntryStatus } from "../domain/enums/journal-entry-status.enum";
import { FinancialYearStatus } from "../domain/enums/financial-year-status.enum";
import { FiscalPeriodStatus } from "../domain/enums/fiscal-period-status.enum";
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
import {
  buildJournalEntry,
  buildJournalEntryLine,
  buildFinancialYear,
  buildFiscalPeriod,
  createFakeAccountingRepository,
  createFakeJournalEntryRepository,
  createFakeLedgerRepository,
  createFakeTransactionRunner,
  createFakeClock,
} from "./test-support/fixtures";

function buildDeps(): ReverseJournalEntryDeps {
  return {
    journalEntryRepository: createFakeJournalEntryRepository(),
    ledgerRepository: createFakeLedgerRepository(),
    repository: createFakeAccountingRepository(),
    transactionRunner: createFakeTransactionRunner(),
    clock: createFakeClock(new Date("2026-04-20T00:00:00.000Z")),
  };
}

/** Covers the fake clock's fixed "now" (2026-04-20) with an Open Financial Year/Fiscal Period, so `postJournalEntry` (reused internally) succeeds. */
function mockOpenPeriodForNow(deps: ReverseJournalEntryDeps) {
  const financialYear = buildFinancialYear({ id: 10n, status: FinancialYearStatus.Open });
  const fiscalPeriod = buildFiscalPeriod({
    id: 20n,
    financialYearId: 10n,
    status: FiscalPeriodStatus.Open,
    startDate: new Date("2026-04-01T00:00:00.000Z"),
    endDate: new Date("2026-04-30T00:00:00.000Z"),
  });
  (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue([financialYear]);
  (deps.repository.listFiscalPeriods as jest.Mock).mockResolvedValue([fiscalPeriod]);
  (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(financialYear);
  (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(fiscalPeriod);
}

const ORIGINAL_UUID = "00000000-0000-0000-0000-0000000000a1";
const REVERSING_UUID = "00000000-0000-0000-0000-0000000000a2";

function buildOriginal(status: JournalEntryStatus) {
  return buildJournalEntry({
    id: 1n,
    uuid: ORIGINAL_UUID,
    status,
    lines: [
      buildJournalEntryLine({ id: 1n, accountId: 1n, debitAmount: DecimalValue.create("1000"), creditAmount: DecimalValue.create("0") }),
      buildJournalEntryLine({ id: 2n, accountId: 2n, debitAmount: DecimalValue.create("0"), creditAmount: DecimalValue.create("1000") }),
    ],
  });
}

function buildReversingDraft() {
  return buildJournalEntry({
    id: 2n,
    uuid: REVERSING_UUID,
    status: JournalEntryStatus.Draft,
    reversalOfJournalEntryId: 1n,
    postingDate: new Date("2026-04-20T00:00:00.000Z"),
    lines: [
      buildJournalEntryLine({ id: 3n, accountId: 1n, debitAmount: DecimalValue.create("0"), creditAmount: DecimalValue.create("1000") }),
      buildJournalEntryLine({ id: 4n, accountId: 2n, debitAmount: DecimalValue.create("1000"), creditAmount: DecimalValue.create("0") }),
    ],
  });
}

describe("reverseJournalEntry", () => {
  it("throws JournalEntryNotFoundError when the original Journal Entry does not exist", async () => {
    const deps = buildDeps();
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(null);

    await expect(reverseJournalEntry({ tenantId: 1n, journalEntryUuid: "missing-uuid" }, deps)).rejects.toThrow(
      JournalEntryNotFoundError,
    );
  });

  it.each([JournalEntryStatus.Draft, JournalEntryStatus.PendingApproval, JournalEntryStatus.Reversed])(
    "throws InvalidJournalEntryStatusTransitionError when the original status is %s (only Posted may be reversed)",
    async (status) => {
      const deps = buildDeps();
      const original = buildOriginal(status);
      (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(original);

      await expect(reverseJournalEntry({ tenantId: 1n, journalEntryUuid: original.uuid }, deps)).rejects.toThrow(
        InvalidJournalEntryStatusTransitionError,
      );
      expect(deps.journalEntryRepository.createJournalEntry).not.toHaveBeenCalled();
    },
  );

  it("creates an inverted reversing entry, posts it, appends Ledger Entries, and marks the original Reversed", async () => {
    const deps = buildDeps();
    mockOpenPeriodForNow(deps);
    const original = buildOriginal(JournalEntryStatus.Posted);
    const reversingDraft = buildReversingDraft();
    const postedReversingEntry = Object.assign(
      Object.create(Object.getPrototypeOf(reversingDraft)),
      reversingDraft,
      { status: JournalEntryStatus.Posted },
    );

    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockImplementation(async (_tenantId: bigint, uuid: string) =>
      uuid === ORIGINAL_UUID ? original : reversingDraft,
    );
    (deps.journalEntryRepository.createJournalEntry as jest.Mock).mockResolvedValue(reversingDraft);
    (deps.journalEntryRepository.postJournalEntry as jest.Mock).mockResolvedValue(postedReversingEntry);
    (deps.ledgerRepository.appendLedgerEntry as jest.Mock).mockResolvedValue(undefined);
    (deps.journalEntryRepository.markJournalEntryReversed as jest.Mock).mockResolvedValue(
      buildOriginal(JournalEntryStatus.Reversed),
    );

    const result = await reverseJournalEntry({ tenantId: 1n, journalEntryUuid: ORIGINAL_UUID, createdBy: 7n }, deps);

    expect(result).toBe(postedReversingEntry);

    expect(deps.journalEntryRepository.createJournalEntry).toHaveBeenCalledWith(1n, {
      companyUuid: original.companyUuid,
      postingDate: new Date("2026-04-20T00:00:00.000Z"),
      narration: `Reversal of Journal Entry '${ORIGINAL_UUID}'`,
      reversalOfJournalEntryId: original.id,
      lines: [
        expect.objectContaining({ accountId: 1n, debitAmount: original.lines[0]!.creditAmount, creditAmount: original.lines[0]!.debitAmount }),
        expect.objectContaining({ accountId: 2n, debitAmount: original.lines[1]!.creditAmount, creditAmount: original.lines[1]!.debitAmount }),
      ],
      createdBy: 7n,
    });

    expect(deps.ledgerRepository.appendLedgerEntry).toHaveBeenCalledTimes(2);
    expect(deps.journalEntryRepository.markJournalEntryReversed).toHaveBeenCalledWith(1n, ORIGINAL_UUID, 7n);
  });
});
