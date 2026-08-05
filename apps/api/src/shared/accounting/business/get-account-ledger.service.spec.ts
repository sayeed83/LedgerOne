import { getAccountLedger, GetAccountLedgerDeps } from "./get-account-ledger.service";
import { AccountNotFoundError, InvalidLedgerDateRangeError, InvalidLedgerCursorError } from "../domain/errors/accounting.errors";
import { AccountType } from "../domain/enums/account-type.enum";
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
import { encodeLedgerCursor } from "./ledger-cursor";
import { buildAccount, buildLedgerEntry, createFakeAccountingRepository, createFakeLedgerRepository } from "./test-support/fixtures";

function buildDeps(): GetAccountLedgerDeps {
  return { repository: createFakeAccountingRepository(), ledgerRepository: createFakeLedgerRepository() };
}

function mockZeroSum(deps: GetAccountLedgerDeps) {
  (deps.ledgerRepository.sumLedgerEntriesBefore as jest.Mock).mockResolvedValue({ totalDebit: "0", totalCredit: "0" });
}

describe("getAccountLedger", () => {
  it("throws AccountNotFoundError when the Account does not exist for the Tenant", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(null);

    await expect(getAccountLedger({ tenantId: 1n, accountUuid: "missing" }, deps)).rejects.toThrow(AccountNotFoundError);
  });

  it("throws InvalidLedgerDateRangeError when dateFrom is after dateTo", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(buildAccount());

    await expect(
      getAccountLedger(
        { tenantId: 1n, accountUuid: "x", dateFrom: new Date("2026-06-01"), dateTo: new Date("2026-01-01") },
        deps,
      ),
    ).rejects.toThrow(InvalidLedgerDateRangeError);
  });

  it("propagates InvalidLedgerCursorError for a malformed cursor", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(buildAccount());

    await expect(getAccountLedger({ tenantId: 1n, accountUuid: "x", cursor: "not-valid" }, deps)).rejects.toThrow(
      InvalidLedgerCursorError,
    );
  });

  it("resolves the Account by uuid, scoped to the Tenant", async () => {
    const deps = buildDeps();
    const account = buildAccount({ uuid: "acct-1" });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);
    mockZeroSum(deps);
    (deps.ledgerRepository.listLedgerEntries as jest.Mock).mockResolvedValue({ entries: [], hasMore: false });

    await getAccountLedger({ tenantId: 7n, accountUuid: "acct-1" }, deps);

    expect(deps.repository.findAccountByUuid).toHaveBeenCalledWith(7n, "acct-1");
  });

  it("defaults the opening balance to zero, WITHOUT calling sumLedgerEntriesBefore, on a truly unbounded first page (no dateFrom, no cursor)", async () => {
    const deps = buildDeps();
    const account = buildAccount({ id: 5n, accountType: AccountType.Asset, companyUuid: "company-1" });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);
    (deps.ledgerRepository.listLedgerEntries as jest.Mock).mockResolvedValue({ entries: [], hasMore: false });

    const result = await getAccountLedger({ tenantId: 1n, accountUuid: "acct-1" }, deps);

    // Regression guard: this used to call sumLedgerEntriesBefore(..., undefined),
    // which sums the ENTIRE history and then double-counted it against the
    // page's own entries (the page itself also starts from the beginning).
    expect(result.openingBalance.toString()).toBe("0");
    expect(deps.ledgerRepository.sumLedgerEntriesBefore).not.toHaveBeenCalled();
  });

  it("computes the opening balance from sumLedgerEntriesBefore when dateFrom bounds the first page, signed by the Account's normal-balance convention (Debit-normal Asset)", async () => {
    const deps = buildDeps();
    const account = buildAccount({ id: 5n, accountType: AccountType.Asset, companyUuid: "company-1" });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);
    (deps.ledgerRepository.sumLedgerEntriesBefore as jest.Mock).mockResolvedValue({ totalDebit: "1000", totalCredit: "200" });
    (deps.ledgerRepository.listLedgerEntries as jest.Mock).mockResolvedValue({ entries: [], hasMore: false });
    const dateFrom = new Date("2026-04-01T00:00:00.000Z");

    const result = await getAccountLedger({ tenantId: 1n, accountUuid: "acct-1", dateFrom }, deps);

    expect(result.openingBalance.toString()).toBe("800");
    expect(deps.ledgerRepository.sumLedgerEntriesBefore).toHaveBeenCalledWith(1n, 5n, "company-1", { entryDate: dateFrom });
  });

  it("computes the opening balance signed for a Credit-normal Account (Revenue)", async () => {
    const deps = buildDeps();
    const account = buildAccount({ id: 5n, accountType: AccountType.Revenue, companyUuid: "company-1" });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);
    (deps.ledgerRepository.sumLedgerEntriesBefore as jest.Mock).mockResolvedValue({ totalDebit: "200", totalCredit: "1000" });
    (deps.ledgerRepository.listLedgerEntries as jest.Mock).mockResolvedValue({ entries: [], hasMore: false });

    const result = await getAccountLedger(
      { tenantId: 1n, accountUuid: "acct-1", dateFrom: new Date("2026-04-01T00:00:00.000Z") },
      deps,
    );

    expect(result.openingBalance.toString()).toBe("800");
  });

  it("passes dateFrom as the opening-balance boundary on an unbounded (non-cursor) first page", async () => {
    const deps = buildDeps();
    const account = buildAccount({ id: 5n, companyUuid: "company-1" });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);
    mockZeroSum(deps);
    (deps.ledgerRepository.listLedgerEntries as jest.Mock).mockResolvedValue({ entries: [], hasMore: false });
    const dateFrom = new Date("2026-04-01T00:00:00.000Z");

    await getAccountLedger({ tenantId: 1n, accountUuid: "acct-1", dateFrom }, deps);

    expect(deps.ledgerRepository.sumLedgerEntriesBefore).toHaveBeenCalledWith(1n, 5n, "company-1", { entryDate: dateFrom });
  });

  it("passes the decoded cursor as the opening-balance boundary when resuming a later page", async () => {
    const deps = buildDeps();
    const account = buildAccount({ id: 5n, companyUuid: "company-1" });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);
    mockZeroSum(deps);
    (deps.ledgerRepository.listLedgerEntries as jest.Mock).mockResolvedValue({ entries: [], hasMore: false });
    const cursorPosition = { entryDate: new Date("2026-04-10T00:00:00.000Z"), uuid: "cursor-row-uuid" };
    const cursor = encodeLedgerCursor(cursorPosition);

    await getAccountLedger({ tenantId: 1n, accountUuid: "acct-1", cursor }, deps);

    expect(deps.ledgerRepository.sumLedgerEntriesBefore).toHaveBeenCalledWith(1n, 5n, "company-1", cursorPosition);
    expect(deps.ledgerRepository.listLedgerEntries).toHaveBeenCalledWith(
      1n,
      expect.objectContaining({ cursor: cursorPosition }),
    );
  });

  it("computes a running balance per entry, carried forward from the opening balance", async () => {
    const deps = buildDeps();
    const account = buildAccount({ id: 5n, accountType: AccountType.Asset, companyUuid: "company-1" });
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(account);
    (deps.ledgerRepository.sumLedgerEntriesBefore as jest.Mock).mockResolvedValue({ totalDebit: "1000", totalCredit: "0" });
    const entries = [
      buildLedgerEntry({ uuid: "e1", debitAmount: DecimalValue.create("100"), creditAmount: DecimalValue.create("0") }),
      buildLedgerEntry({ uuid: "e2", debitAmount: DecimalValue.create("0"), creditAmount: DecimalValue.create("50") }),
    ];
    (deps.ledgerRepository.listLedgerEntries as jest.Mock).mockResolvedValue({ entries, hasMore: false });

    const result = await getAccountLedger(
      { tenantId: 1n, accountUuid: "acct-1", dateFrom: new Date("2026-04-01T00:00:00.000Z") },
      deps,
    );

    expect(result.entries.map((e) => e.runningBalance.toString())).toEqual(["1100", "1050"]);
    expect(result.closingBalance.toString()).toBe("1050");
  });

  it("returns a null nextCursor when there is no further page", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(buildAccount({ id: 5n }));
    mockZeroSum(deps);
    (deps.ledgerRepository.listLedgerEntries as jest.Mock).mockResolvedValue({
      entries: [buildLedgerEntry({ uuid: "e1" })],
      hasMore: false,
    });

    const result = await getAccountLedger({ tenantId: 1n, accountUuid: "acct-1" }, deps);

    expect(result.pagination.hasMore).toBe(false);
    expect(result.pagination.nextCursor).toBeNull();
  });

  it("encodes an opaque nextCursor from the last returned entry's own position when a further page exists", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(buildAccount({ id: 5n }));
    mockZeroSum(deps);
    const lastEntry = buildLedgerEntry({ uuid: "last-row-uuid", entryDate: new Date("2026-04-20T00:00:00.000Z") });
    (deps.ledgerRepository.listLedgerEntries as jest.Mock).mockResolvedValue({ entries: [lastEntry], hasMore: true });

    const result = await getAccountLedger({ tenantId: 1n, accountUuid: "acct-1" }, deps);

    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.nextCursor).not.toBeNull();
    expect(result.pagination.nextCursor).not.toContain("last-row-uuid");
  });

  it("defaults the page size to 25 and clamps a request above the max down to 100 (PAG-004)", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(buildAccount({ id: 5n }));
    mockZeroSum(deps);
    (deps.ledgerRepository.listLedgerEntries as jest.Mock).mockResolvedValue({ entries: [], hasMore: false });

    const defaultResult = await getAccountLedger({ tenantId: 1n, accountUuid: "acct-1" }, deps);
    expect(defaultResult.pagination.limit).toBe(25);

    const clampedResult = await getAccountLedger({ tenantId: 1n, accountUuid: "acct-1", limit: 5000 }, deps);
    expect(clampedResult.pagination.limit).toBe(100);
  });

  it("uses the Account's own companyUuid when none is explicitly supplied", async () => {
    const deps = buildDeps();
    (deps.repository.findAccountByUuid as jest.Mock).mockResolvedValue(buildAccount({ id: 5n, companyUuid: "acct-company" }));
    mockZeroSum(deps);
    (deps.ledgerRepository.listLedgerEntries as jest.Mock).mockResolvedValue({ entries: [], hasMore: false });

    await getAccountLedger({ tenantId: 1n, accountUuid: "acct-1" }, deps);

    expect(deps.ledgerRepository.listLedgerEntries).toHaveBeenCalledWith(1n, expect.objectContaining({ companyUuid: "acct-company" }));
  });
});
