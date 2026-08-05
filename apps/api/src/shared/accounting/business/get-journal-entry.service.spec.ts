import { getJournalEntry, GetJournalEntryDeps } from "./get-journal-entry.service";
import { JournalEntryNotFoundError } from "../domain/errors/accounting.errors";
import { buildJournalEntry, createFakeJournalEntryRepository } from "./test-support/fixtures";

function buildDeps(): GetJournalEntryDeps {
  return { journalEntryRepository: createFakeJournalEntryRepository() };
}

describe("getJournalEntry", () => {
  it("throws JournalEntryNotFoundError when the Journal Entry does not exist for the Tenant", async () => {
    const deps = buildDeps();
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getJournalEntry({ tenantId: 1n, journalEntryUuid: "missing-uuid" }, deps)).rejects.toThrow(
      JournalEntryNotFoundError,
    );
  });

  it("returns the Journal Entry when found", async () => {
    const deps = buildDeps();
    const journalEntry = buildJournalEntry();
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockResolvedValue(journalEntry);

    const result = await getJournalEntry({ tenantId: 1n, journalEntryUuid: journalEntry.uuid }, deps);

    expect(result).toBe(journalEntry);
    expect(deps.journalEntryRepository.findJournalEntryByUuid).toHaveBeenCalledWith(1n, journalEntry.uuid);
  });

  it("does not leak a Journal Entry belonging to a different Tenant (tenant isolation)", async () => {
    const deps = buildDeps();
    (deps.journalEntryRepository.findJournalEntryByUuid as jest.Mock).mockImplementation(
      async (tenantId: bigint) => (tenantId === 1n ? buildJournalEntry() : null),
    );

    await expect(getJournalEntry({ tenantId: 2n, journalEntryUuid: "some-uuid" }, deps)).rejects.toThrow(
      JournalEntryNotFoundError,
    );
  });
});
