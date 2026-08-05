import { createJournalEntry, CreateJournalEntryDeps, CreateJournalEntryInput } from "./create-journal-entry.service";
import {
  JournalEntryMinimumLinesError,
  JournalEntryMinimumDistinctAccountsError,
  InvalidJournalEntryLineAmountError,
  AccountNotFoundError,
  AccountNotActiveError,
  AccountNotPostableError,
} from "../domain/errors/accounting.errors";
import { AccountStatus } from "../domain/enums/account-status.enum";
import { buildAccount, buildJournalEntry, createFakeAccountingRepository, createFakeJournalEntryRepository } from "./test-support/fixtures";

function buildDeps(): CreateJournalEntryDeps {
  return { journalEntryRepository: createFakeJournalEntryRepository(), repository: createFakeAccountingRepository() };
}

function buildInput(overrides: Partial<CreateJournalEntryInput> = {}): CreateJournalEntryInput {
  return {
    tenantId: 1n,
    companyUuid: "00000000-0000-0000-0000-000000000100",
    postingDate: new Date("2026-04-15T00:00:00.000Z"),
    narration: "Test entry",
    lines: [
      { accountUuid: "00000000-0000-0000-0000-000000000701", debitAmount: "1000.00", creditAmount: "0" },
      { accountUuid: "00000000-0000-0000-0000-000000000702", debitAmount: "0", creditAmount: "1000.00" },
    ],
    ...overrides,
  };
}

describe("createJournalEntry", () => {
  it("throws JournalEntryMinimumLinesError when fewer than two lines are supplied", async () => {
    const deps = buildDeps();

    await expect(
      createJournalEntry(buildInput({ lines: [{ accountUuid: "x", debitAmount: "100", creditAmount: "0" }] }), deps),
    ).rejects.toThrow(JournalEntryMinimumLinesError);
    expect(deps.journalEntryRepository.createJournalEntry).not.toHaveBeenCalled();
  });

  it("throws AccountNotFoundError when a line's Account does not exist", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(null);

    await expect(createJournalEntry(buildInput(), deps)).rejects.toThrow(AccountNotFoundError);
    expect(deps.journalEntryRepository.createJournalEntry).not.toHaveBeenCalled();
  });

  it("throws AccountNotActiveError when a line's Account is not Active (Inactive Account)", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(buildAccount({ status: AccountStatus.Inactive }));

    await expect(createJournalEntry(buildInput(), deps)).rejects.toThrow(AccountNotActiveError);
    expect(deps.journalEntryRepository.createJournalEntry).not.toHaveBeenCalled();
  });

  it("throws AccountNotPostableError when a line's Account is a Summary Account", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(
      buildAccount({ status: AccountStatus.Active, isPostingAccount: false }),
    );

    await expect(createJournalEntry(buildInput(), deps)).rejects.toThrow(AccountNotPostableError);
    expect(deps.journalEntryRepository.createJournalEntry).not.toHaveBeenCalled();
  });

  it("throws InvalidJournalEntryLineAmountError when a line has both debit and credit positive", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(buildAccount({ status: AccountStatus.Active, isPostingAccount: true }));

    await expect(
      createJournalEntry(
        buildInput({
          lines: [
            { accountUuid: "00000000-0000-0000-0000-000000000701", debitAmount: "100", creditAmount: "100" },
            { accountUuid: "00000000-0000-0000-0000-000000000702", debitAmount: "0", creditAmount: "0" },
          ],
        }),
        deps,
      ),
    ).rejects.toThrow(InvalidJournalEntryLineAmountError);
    expect(deps.journalEntryRepository.createJournalEntry).not.toHaveBeenCalled();
  });

  it("throws InvalidJournalEntryLineAmountError when a line has neither debit nor credit positive", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(buildAccount({ status: AccountStatus.Active, isPostingAccount: true }));

    await expect(
      createJournalEntry(
        buildInput({
          lines: [
            { accountUuid: "00000000-0000-0000-0000-000000000701", debitAmount: "0", creditAmount: "0" },
            { accountUuid: "00000000-0000-0000-0000-000000000702", debitAmount: "0", creditAmount: "100" },
          ],
        }),
        deps,
      ),
    ).rejects.toThrow(InvalidJournalEntryLineAmountError);
  });

  it("throws JournalEntryMinimumDistinctAccountsError when every line resolves to the same Account", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(
      buildAccount({ id: 9n, status: AccountStatus.Active, isPostingAccount: true }),
    );

    await expect(
      createJournalEntry(
        buildInput({
          lines: [
            { accountUuid: "00000000-0000-0000-0000-000000000701", debitAmount: "100", creditAmount: "0" },
            { accountUuid: "00000000-0000-0000-0000-000000000701", debitAmount: "0", creditAmount: "100" },
          ],
        }),
        deps,
      ),
    ).rejects.toThrow(JournalEntryMinimumDistinctAccountsError);
    expect(deps.journalEntryRepository.createJournalEntry).not.toHaveBeenCalled();
  });

  it("creates the Journal Entry when every check passes, even if the lines are not balanced (deferred to posting)", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock)
      .mockResolvedValueOnce(buildAccount({ id: 5n, status: AccountStatus.Active, isPostingAccount: true }))
      .mockResolvedValueOnce(buildAccount({ id: 6n, status: AccountStatus.Active, isPostingAccount: true }));
    (deps.journalEntryRepository.createJournalEntry as jest.Mock).mockResolvedValue(buildJournalEntry());

    await createJournalEntry(
      buildInput({
        lines: [
          { accountUuid: "00000000-0000-0000-0000-000000000701", debitAmount: "1000", creditAmount: "0" },
          { accountUuid: "00000000-0000-0000-0000-000000000702", debitAmount: "0", creditAmount: "1.00" },
        ],
        createdBy: 7n,
      }),
      deps,
    );

    expect(deps.journalEntryRepository.createJournalEntry).toHaveBeenCalledWith(1n, {
      companyUuid: "00000000-0000-0000-0000-000000000100",
      postingDate: new Date("2026-04-15T00:00:00.000Z"),
      narration: "Test entry",
      lines: [
        expect.objectContaining({ accountId: 5n, createdBy: 7n }),
        expect.objectContaining({ accountId: 6n, createdBy: 7n }),
      ],
      createdBy: 7n,
    });
  });
});
