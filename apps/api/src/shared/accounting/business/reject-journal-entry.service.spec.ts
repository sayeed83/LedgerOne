import { rejectJournalEntry, RejectJournalEntryDeps } from "./reject-journal-entry.service";
import { JournalEntryNotFoundError, InvalidJournalEntryStatusTransitionError } from "../domain/errors/accounting.errors";
import { JournalEntryStatus } from "../domain/enums/journal-entry-status.enum";
import { buildJournalEntry, createFakeJournalEntryRepository } from "./test-support/fixtures";

function buildDeps(): RejectJournalEntryDeps {
  return { journalEntryRepository: createFakeJournalEntryRepository() };
}

describe("rejectJournalEntry", () => {
  it("throws JournalEntryNotFoundError when the Journal Entry does not exist", async () => {
    const deps = buildDeps();
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(null);

    await expect(rejectJournalEntry({ tenantId: 1n, journalEntryUuid: "missing-uuid" }, deps)).rejects.toThrow(
      JournalEntryNotFoundError,
    );
  });

  it.each([JournalEntryStatus.Draft, JournalEntryStatus.Posted, JournalEntryStatus.Reversed])(
    "throws InvalidJournalEntryStatusTransitionError when status is %s",
    async (status) => {
      const deps = buildDeps();
      const journalEntry = buildJournalEntry({ status });
      (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(journalEntry);

      await expect(rejectJournalEntry({ tenantId: 1n, journalEntryUuid: journalEntry.uuid }, deps)).rejects.toThrow(
        InvalidJournalEntryStatusTransitionError,
      );
      expect(deps.journalEntryRepository.rejectJournalEntry).not.toHaveBeenCalled();
    },
  );

  it("rejects a PendingApproval Journal Entry back to Draft", async () => {
    const deps = buildDeps();
    const journalEntry = buildJournalEntry({ status: JournalEntryStatus.PendingApproval });
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(journalEntry);
    (deps.journalEntryRepository.rejectJournalEntry as jest.Mock).mockResolvedValue(journalEntry);

    await rejectJournalEntry({ tenantId: 1n, journalEntryUuid: journalEntry.uuid, updatedBy: 2n }, deps);

    expect(deps.journalEntryRepository.rejectJournalEntry).toHaveBeenCalledWith(1n, journalEntry.uuid, 2n);
  });
});
