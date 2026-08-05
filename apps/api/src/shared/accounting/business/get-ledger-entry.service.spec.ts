import { getLedgerEntry, GetLedgerEntryDeps } from "./get-ledger-entry.service";
import { LedgerEntryNotFoundError } from "../domain/errors/accounting.errors";
import { buildLedgerEntry, buildJournalEntry, createFakeLedgerRepository, createFakeJournalEntryRepository } from "./test-support/fixtures";

function buildDeps(): GetLedgerEntryDeps {
  return { ledgerRepository: createFakeLedgerRepository(), journalEntryRepository: createFakeJournalEntryRepository() };
}

describe("getLedgerEntry", () => {
  it("throws LedgerEntryNotFoundError when the Ledger Entry does not exist for the Tenant", async () => {
    const deps = buildDeps();
    (deps.ledgerRepository.findLedgerEntryByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getLedgerEntry({ tenantId: 1n, ledgerEntryUuid: "missing" }, deps)).rejects.toThrow(LedgerEntryNotFoundError);
    expect(deps.journalEntryRepository.findJournalEntryByLineId).not.toHaveBeenCalled();
  });

  it("resolves the originating Journal Entry via the Ledger Entry's journalEntryLineId (Ch.19.11 drill-down)", async () => {
    const deps = buildDeps();
    const ledgerEntry = buildLedgerEntry({ journalEntryLineId: 42n });
    const journalEntry = buildJournalEntry();
    (deps.ledgerRepository.findLedgerEntryByUuid as jest.Mock).mockResolvedValue(ledgerEntry);
    (deps.journalEntryRepository.findJournalEntryByLineId as jest.Mock).mockResolvedValue(journalEntry);

    const result = await getLedgerEntry({ tenantId: 1n, ledgerEntryUuid: ledgerEntry.uuid }, deps);

    expect(result.ledgerEntry).toBe(ledgerEntry);
    expect(result.journalEntry).toBe(journalEntry);
    expect(deps.journalEntryRepository.findJournalEntryByLineId).toHaveBeenCalledWith(1n, 42n);
  });

  it("throws LedgerEntryNotFoundError if no Journal Entry owns the line (system-integrity failure class, not a normal not-found)", async () => {
    const deps = buildDeps();
    const ledgerEntry = buildLedgerEntry();
    (deps.ledgerRepository.findLedgerEntryByUuid as jest.Mock).mockResolvedValue(ledgerEntry);
    (deps.journalEntryRepository.findJournalEntryByLineId as jest.Mock).mockResolvedValue(null);

    await expect(getLedgerEntry({ tenantId: 1n, ledgerEntryUuid: ledgerEntry.uuid }, deps)).rejects.toThrow(LedgerEntryNotFoundError);
  });
});
