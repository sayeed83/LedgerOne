import { listJournalEntries, ListJournalEntriesDeps } from "./list-journal-entries.service";
import { JournalEntryStatus } from "../domain/enums/journal-entry-status.enum";
import { buildJournalEntry, createFakeJournalEntryRepository } from "./test-support/fixtures";

function buildDeps(): ListJournalEntriesDeps {
  return { journalEntryRepository: createFakeJournalEntryRepository() };
}

describe("listJournalEntries", () => {
  it("passes tenantId, companyUuid, and status through to the Repository", async () => {
    const deps = buildDeps();
    const entries = [buildJournalEntry()];
    (deps.journalEntryRepository.listJournalEntries as jest.Mock).mockResolvedValue(entries);

    const result = await listJournalEntries(
      { tenantId: 1n, companyUuid: "00000000-0000-0000-0000-000000000100", status: JournalEntryStatus.Posted },
      deps,
    );

    expect(result).toBe(entries);
    expect(deps.journalEntryRepository.listJournalEntries).toHaveBeenCalledWith(
      1n,
      "00000000-0000-0000-0000-000000000100",
      JournalEntryStatus.Posted,
    );
  });
});
