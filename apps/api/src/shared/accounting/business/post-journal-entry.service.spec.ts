import { postJournalEntry, PostJournalEntryDeps } from "./post-journal-entry.service";
import {
  JournalEntryNotFoundError,
  InvalidJournalEntryStatusTransitionError,
  JournalEntryNotBalancedError,
  FiscalPeriodNotOpenError,
  FinancialYearNotOpenError,
} from "../domain/errors/accounting.errors";
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
} from "./test-support/fixtures";

function buildDeps(): PostJournalEntryDeps {
  return {
    journalEntryRepository: createFakeJournalEntryRepository(),
    ledgerRepository: createFakeLedgerRepository(),
    repository: createFakeAccountingRepository(),
    transactionRunner: createFakeTransactionRunner(),
  };
}

/** Mocks an Open Financial Year + Fiscal Period covering the fixture Journal Entry's posting date (2026-04-15). */
function mockOpenPeriod(deps: PostJournalEntryDeps) {
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

function balancedJournalEntry(status: JournalEntryStatus = JournalEntryStatus.Draft) {
  return buildJournalEntry({
    status,
    lines: [
      buildJournalEntryLine({ id: 1n, accountId: 1n, debitAmount: DecimalValue.create("1000"), creditAmount: DecimalValue.create("0") }),
      buildJournalEntryLine({ id: 2n, accountId: 2n, debitAmount: DecimalValue.create("0"), creditAmount: DecimalValue.create("1000") }),
    ],
  });
}

describe("postJournalEntry", () => {
  it("throws JournalEntryNotFoundError when the Journal Entry does not exist", async () => {
    const deps = buildDeps();
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(null);

    await expect(postJournalEntry({ tenantId: 1n, journalEntryUuid: "missing-uuid" }, deps)).rejects.toThrow(
      JournalEntryNotFoundError,
    );
    expect(deps.transactionRunner.run).not.toHaveBeenCalled();
  });

  it("throws InvalidJournalEntryStatusTransitionError when the Journal Entry is already Posted", async () => {
    const deps = buildDeps();
    const journalEntry = balancedJournalEntry(JournalEntryStatus.Posted);
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(journalEntry);

    await expect(postJournalEntry({ tenantId: 1n, journalEntryUuid: journalEntry.uuid }, deps)).rejects.toThrow(
      InvalidJournalEntryStatusTransitionError,
    );
    expect(deps.transactionRunner.run).not.toHaveBeenCalled();
  });

  it("throws InvalidJournalEntryStatusTransitionError when the Journal Entry is already Reversed", async () => {
    const deps = buildDeps();
    const journalEntry = balancedJournalEntry(JournalEntryStatus.Reversed);
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(journalEntry);

    await expect(postJournalEntry({ tenantId: 1n, journalEntryUuid: journalEntry.uuid }, deps)).rejects.toThrow(
      InvalidJournalEntryStatusTransitionError,
    );
  });

  it("throws JournalEntryNotBalancedError for an unbalanced Journal Entry and never opens a transaction", async () => {
    const deps = buildDeps();
    mockOpenPeriod(deps);
    const journalEntry = buildJournalEntry({
      status: JournalEntryStatus.Draft,
      lines: [
        buildJournalEntryLine({ id: 1n, accountId: 1n, debitAmount: DecimalValue.create("1000"), creditAmount: DecimalValue.create("0") }),
        buildJournalEntryLine({ id: 2n, accountId: 2n, debitAmount: DecimalValue.create("0"), creditAmount: DecimalValue.create("999") }),
      ],
    });
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(journalEntry);

    await expect(postJournalEntry({ tenantId: 1n, journalEntryUuid: journalEntry.uuid }, deps)).rejects.toThrow(
      JournalEntryNotBalancedError,
    );
    expect(deps.transactionRunner.run).not.toHaveBeenCalled();
  });

  it("throws FinancialYearNotOpenError when the covering Financial Year is Closed", async () => {
    const deps = buildDeps();
    mockOpenPeriod(deps);
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(
      buildFinancialYear({ id: 10n, status: FinancialYearStatus.Closed }),
    );
    const journalEntry = balancedJournalEntry();
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(journalEntry);

    await expect(postJournalEntry({ tenantId: 1n, journalEntryUuid: journalEntry.uuid }, deps)).rejects.toThrow(
      FinancialYearNotOpenError,
    );
    expect(deps.transactionRunner.run).not.toHaveBeenCalled();
  });

  it("throws FiscalPeriodNotOpenError when the covering Fiscal Period is Closed", async () => {
    const deps = buildDeps();
    mockOpenPeriod(deps);
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(
      buildFiscalPeriod({ id: 20n, financialYearId: 10n, status: FiscalPeriodStatus.Closed }),
    );
    const journalEntry = balancedJournalEntry();
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(journalEntry);

    await expect(postJournalEntry({ tenantId: 1n, journalEntryUuid: journalEntry.uuid }, deps)).rejects.toThrow(
      FiscalPeriodNotOpenError,
    );
    expect(deps.transactionRunner.run).not.toHaveBeenCalled();
  });

  it("posts the Journal Entry and appends one Ledger Entry per line, inside one transaction", async () => {
    const deps = buildDeps();
    mockOpenPeriod(deps);
    const journalEntry = balancedJournalEntry();
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(journalEntry);
    const posted = balancedJournalEntry(JournalEntryStatus.Posted);
    (deps.journalEntryRepository.postJournalEntry as jest.Mock).mockResolvedValue(posted);
    (deps.ledgerRepository.appendLedgerEntry as jest.Mock).mockResolvedValue(undefined);

    const result = await postJournalEntry({ tenantId: 1n, journalEntryUuid: journalEntry.uuid, updatedBy: 9n }, deps);

    expect(result).toBe(posted);
    expect(deps.transactionRunner.run).toHaveBeenCalledTimes(1);
    expect(deps.journalEntryRepository.postJournalEntry).toHaveBeenCalledWith(1n, journalEntry.uuid, 9n, "fake-tx");
    expect(deps.ledgerRepository.appendLedgerEntry).toHaveBeenCalledTimes(2);
    expect(deps.ledgerRepository.appendLedgerEntry).toHaveBeenNthCalledWith(
      1,
      1n,
      {
        companyUuid: journalEntry.companyUuid,
        accountId: 1n,
        journalEntryLineId: 1n,
        debitAmount: journalEntry.lines[0]!.debitAmount,
        creditAmount: journalEntry.lines[0]!.creditAmount,
        entryDate: journalEntry.postingDate,
        createdBy: 9n,
      },
      "fake-tx",
    );
    expect(deps.ledgerRepository.appendLedgerEntry).toHaveBeenNthCalledWith(
      2,
      1n,
      expect.objectContaining({ accountId: 2n, journalEntryLineId: 2n }),
      "fake-tx",
    );
  });

  it("propagates a Ledger append failure and does not return a posted entry (transaction rollback)", async () => {
    const deps = buildDeps();
    mockOpenPeriod(deps);
    const journalEntry = balancedJournalEntry();
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(journalEntry);
    (deps.journalEntryRepository.postJournalEntry as jest.Mock).mockResolvedValue(balancedJournalEntry(JournalEntryStatus.Posted));
    (deps.ledgerRepository.appendLedgerEntry as jest.Mock).mockRejectedValue(new Error("ledger write failed"));

    await expect(postJournalEntry({ tenantId: 1n, journalEntryUuid: journalEntry.uuid }, deps)).rejects.toThrow(
      "ledger write failed",
    );
  });
});
