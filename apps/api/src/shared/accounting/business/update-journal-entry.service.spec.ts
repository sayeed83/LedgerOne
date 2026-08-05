import { updateJournalEntry, UpdateJournalEntryDeps } from "./update-journal-entry.service";
import { JournalEntryNotFoundError, JournalEntryNotEditableError } from "../domain/errors/accounting.errors";
import { JournalEntryStatus } from "../domain/enums/journal-entry-status.enum";
import { buildJournalEntry, createFakeJournalEntryRepository } from "./test-support/fixtures";

function buildDeps(): UpdateJournalEntryDeps {
  return { journalEntryRepository: createFakeJournalEntryRepository() };
}

describe("updateJournalEntry", () => {
  it("throws JournalEntryNotFoundError when the Journal Entry does not exist", async () => {
    const deps = buildDeps();
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      updateJournalEntry({ tenantId: 1n, journalEntryUuid: "missing-uuid", narration: "x" }, deps),
    ).rejects.toThrow(JournalEntryNotFoundError);
  });

  it.each([JournalEntryStatus.PendingApproval, JournalEntryStatus.Posted, JournalEntryStatus.Reversed])(
    "throws JournalEntryNotEditableError when status is %s",
    async (status) => {
      const deps = buildDeps();
      const journalEntry = buildJournalEntry({ status });
      (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(journalEntry);

      await expect(
        updateJournalEntry({ tenantId: 1n, journalEntryUuid: journalEntry.uuid, narration: "x" }, deps),
      ).rejects.toThrow(JournalEntryNotEditableError);
      expect(deps.journalEntryRepository.updateJournalEntry).not.toHaveBeenCalled();
    },
  );

  it("updates the Journal Entry when it is Draft", async () => {
    const deps = buildDeps();
    const journalEntry = buildJournalEntry({ status: JournalEntryStatus.Draft });
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(journalEntry);
    (deps.journalEntryRepository.updateJournalEntry as jest.Mock).mockResolvedValue(journalEntry);

    await updateJournalEntry(
      { tenantId: 1n, journalEntryUuid: journalEntry.uuid, narration: "Revised", updatedBy: 3n },
      deps,
    );

    expect(deps.journalEntryRepository.updateJournalEntry).toHaveBeenCalledWith(1n, journalEntry.uuid, {
      postingDate: undefined,
      narration: "Revised",
      updatedBy: 3n,
    });
  });
});
