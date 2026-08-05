import { validateJournalEntryPostable, ValidateJournalEntryPostableDeps } from "./validate-journal-entry-postable.service";
import {
  JournalEntryMinimumLinesError,
  JournalEntryMinimumDistinctAccountsError,
  JournalEntryNotBalancedError,
  NoFiscalPeriodForPostingDateError,
  FiscalPeriodNotOpenError,
  FinancialYearNotOpenError,
} from "../domain/errors/accounting.errors";
import { FinancialYearStatus } from "../domain/enums/financial-year-status.enum";
import { FiscalPeriodStatus } from "../domain/enums/fiscal-period-status.enum";
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
import { buildJournalEntry, buildJournalEntryLine, buildFinancialYear, buildFiscalPeriod, createFakeAccountingRepository } from "./test-support/fixtures";

function buildDeps(): ValidateJournalEntryPostableDeps {
  return { repository: createFakeAccountingRepository() };
}

function mockOpenPeriodCoveringPostingDate(deps: ValidateJournalEntryPostableDeps) {
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
  return { financialYear, fiscalPeriod };
}

describe("validateJournalEntryPostable", () => {
  it("throws JournalEntryMinimumLinesError when fewer than two lines", async () => {
    const deps = buildDeps();
    const journalEntry = buildJournalEntry({ lines: [buildJournalEntryLine()] });

    await expect(validateJournalEntryPostable({ tenantId: 1n, journalEntry }, deps)).rejects.toThrow(
      JournalEntryMinimumLinesError,
    );
  });

  it("throws JournalEntryMinimumDistinctAccountsError when all lines share the same Account", async () => {
    const deps = buildDeps();
    const journalEntry = buildJournalEntry({
      lines: [
        buildJournalEntryLine({ id: 1n, accountId: 5n, debitAmount: DecimalValue.create("100"), creditAmount: DecimalValue.create("0") }),
        buildJournalEntryLine({ id: 2n, accountId: 5n, debitAmount: DecimalValue.create("0"), creditAmount: DecimalValue.create("100") }),
      ],
    });

    await expect(validateJournalEntryPostable({ tenantId: 1n, journalEntry }, deps)).rejects.toThrow(
      JournalEntryMinimumDistinctAccountsError,
    );
  });

  it("throws JournalEntryNotBalancedError when debits and credits do not match", async () => {
    const deps = buildDeps();
    const journalEntry = buildJournalEntry({
      lines: [
        buildJournalEntryLine({ id: 1n, accountId: 1n, debitAmount: DecimalValue.create("1000"), creditAmount: DecimalValue.create("0") }),
        buildJournalEntryLine({ id: 2n, accountId: 2n, debitAmount: DecimalValue.create("0"), creditAmount: DecimalValue.create("999") }),
      ],
    });

    await expect(validateJournalEntryPostable({ tenantId: 1n, journalEntry }, deps)).rejects.toThrow(
      JournalEntryNotBalancedError,
    );
  });

  it("throws NoFiscalPeriodForPostingDateError when no Fiscal Period covers the posting date", async () => {
    const deps = buildDeps();
    (deps.repository.listFinancialYears as jest.Mock).mockResolvedValue([]);
    const journalEntry = buildJournalEntry();

    await expect(validateJournalEntryPostable({ tenantId: 1n, journalEntry }, deps)).rejects.toThrow(
      NoFiscalPeriodForPostingDateError,
    );
  });

  it("throws FinancialYearNotOpenError when the covering Financial Year is not Open", async () => {
    const deps = buildDeps();
    const { financialYear } = mockOpenPeriodCoveringPostingDate(deps);
    (deps.repository.findFinancialYearByUuid as jest.Mock).mockResolvedValue(
      Object.assign(Object.create(Object.getPrototypeOf(financialYear)), financialYear, { status: FinancialYearStatus.Closed }),
    );
    const journalEntry = buildJournalEntry();

    await expect(validateJournalEntryPostable({ tenantId: 1n, journalEntry }, deps)).rejects.toThrow(
      FinancialYearNotOpenError,
    );
  });

  it("throws FiscalPeriodNotOpenError when the covering Fiscal Period is not Open", async () => {
    const deps = buildDeps();
    const { fiscalPeriod } = mockOpenPeriodCoveringPostingDate(deps);
    (deps.repository.findFiscalPeriodByUuid as jest.Mock).mockResolvedValue(
      Object.assign(Object.create(Object.getPrototypeOf(fiscalPeriod)), fiscalPeriod, { status: FiscalPeriodStatus.Closed }),
    );
    const journalEntry = buildJournalEntry();

    await expect(validateJournalEntryPostable({ tenantId: 1n, journalEntry }, deps)).rejects.toThrow(
      FiscalPeriodNotOpenError,
    );
  });

  it("resolves without throwing when balanced, sufficiently distinct, and the covering period/year are Open", async () => {
    const deps = buildDeps();
    mockOpenPeriodCoveringPostingDate(deps);
    const journalEntry = buildJournalEntry();

    await expect(validateJournalEntryPostable({ tenantId: 1n, journalEntry }, deps)).resolves.toBeUndefined();
  });
});
