import { submitJournalEntryForApproval, SubmitJournalEntryForApprovalDeps } from "./submit-journal-entry-for-approval.service";
import { JournalEntryNotFoundError, InvalidJournalEntryStatusTransitionError } from "../domain/errors/accounting.errors";
import { JournalEntryStatus } from "../domain/enums/journal-entry-status.enum";
import { buildJournalEntry, createFakeJournalEntryRepository } from "./test-support/fixtures";

function buildDeps(): SubmitJournalEntryForApprovalDeps {
  return { journalEntryRepository: createFakeJournalEntryRepository() };
}

describe("submitJournalEntryForApproval", () => {
  it("throws JournalEntryNotFoundError when the Journal Entry does not exist", async () => {
    const deps = buildDeps();
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(null);

    await expect(
      submitJournalEntryForApproval({ tenantId: 1n, journalEntryUuid: "missing-uuid" }, deps),
    ).rejects.toThrow(JournalEntryNotFoundError);
  });

  it.each([JournalEntryStatus.PendingApproval, JournalEntryStatus.Posted, JournalEntryStatus.Reversed])(
    "throws InvalidJournalEntryStatusTransitionError when status is %s",
    async (status) => {
      const deps = buildDeps();
      const journalEntry = buildJournalEntry({ status });
      (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(journalEntry);

      await expect(
        submitJournalEntryForApproval({ tenantId: 1n, journalEntryUuid: journalEntry.uuid }, deps),
      ).rejects.toThrow(InvalidJournalEntryStatusTransitionError);
      expect(deps.journalEntryRepository.submitJournalEntryForApproval).not.toHaveBeenCalled();
    },
  );

  it("submits a Draft Journal Entry for approval", async () => {
    const deps = buildDeps();
    const journalEntry = buildJournalEntry({ status: JournalEntryStatus.Draft });
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(journalEntry);
    (deps.journalEntryRepository.submitJournalEntryForApproval as jest.Mock).mockResolvedValue(journalEntry);

    await submitJournalEntryForApproval({ tenantId: 1n, journalEntryUuid: journalEntry.uuid, updatedBy: 2n }, deps);

    expect(deps.journalEntryRepository.submitJournalEntryForApproval).toHaveBeenCalledWith(1n, journalEntry.uuid, 2n);
  });
});
