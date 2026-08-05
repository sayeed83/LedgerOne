import { calculateRunningBalance, netBalance, isDebitNormal } from "./calculate-running-balance.service";
import { AccountType } from "../domain/enums/account-type.enum";
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
import { buildLedgerEntry } from "./test-support/fixtures";

describe("isDebitNormal", () => {
  it("is true for Asset and Expense (Ch.16 DBL-003)", () => {
    expect(isDebitNormal(AccountType.Asset)).toBe(true);
    expect(isDebitNormal(AccountType.Expense)).toBe(true);
  });

  it("is false for Liability, Equity, and Revenue", () => {
    expect(isDebitNormal(AccountType.Liability)).toBe(false);
    expect(isDebitNormal(AccountType.Equity)).toBe(false);
    expect(isDebitNormal(AccountType.Revenue)).toBe(false);
  });
});

describe("netBalance", () => {
  it("nets a Debit-normal Account as debit minus credit", () => {
    const result = netBalance(AccountType.Asset, DecimalValue.create("500"), DecimalValue.create("200"));
    expect(result.toString()).toBe("300");
  });

  it("nets a Credit-normal Account as credit minus debit", () => {
    const result = netBalance(AccountType.Revenue, DecimalValue.create("200"), DecimalValue.create("500"));
    expect(result.toString()).toBe("300");
  });
});

describe("calculateRunningBalance", () => {
  it("carries the opening balance forward across entries in order for a Debit-normal Account", () => {
    const entries = [
      buildLedgerEntry({ uuid: "e1", debitAmount: DecimalValue.create("100"), creditAmount: DecimalValue.create("0") }),
      buildLedgerEntry({ uuid: "e2", debitAmount: DecimalValue.create("0"), creditAmount: DecimalValue.create("30") }),
      buildLedgerEntry({ uuid: "e3", debitAmount: DecimalValue.create("50"), creditAmount: DecimalValue.create("0") }),
    ];

    const result = calculateRunningBalance(AccountType.Asset, DecimalValue.create("1000"), entries);

    expect(result.entries.map((e) => e.runningBalance.toString())).toEqual(["1100", "1070", "1120"]);
    expect(result.closingBalance.toString()).toBe("1120");
  });

  it("carries the opening balance forward for a Credit-normal Account (Revenue)", () => {
    const entries = [
      buildLedgerEntry({ uuid: "e1", debitAmount: DecimalValue.create("0"), creditAmount: DecimalValue.create("500") }),
      buildLedgerEntry({ uuid: "e2", debitAmount: DecimalValue.create("100"), creditAmount: DecimalValue.create("0") }),
    ];

    const result = calculateRunningBalance(AccountType.Revenue, DecimalValue.create("0"), entries);

    expect(result.entries.map((e) => e.runningBalance.toString())).toEqual(["500", "400"]);
    expect(result.closingBalance.toString()).toBe("400");
  });

  it("returns the opening balance unchanged as the closing balance when there are no entries", () => {
    const result = calculateRunningBalance(AccountType.Asset, DecimalValue.create("250"), []);

    expect(result.entries).toEqual([]);
    expect(result.closingBalance.toString()).toBe("250");
  });

  it("preserves each entry alongside its own running balance", () => {
    const entry = buildLedgerEntry({ uuid: "e1", debitAmount: DecimalValue.create("10"), creditAmount: DecimalValue.create("0") });

    const result = calculateRunningBalance(AccountType.Asset, DecimalValue.create("0"), [entry]);

    expect(result.entries[0]?.entry).toBe(entry);
  });
});
