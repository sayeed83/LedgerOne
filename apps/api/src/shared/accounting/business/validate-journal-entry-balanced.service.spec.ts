import { validateJournalEntryBalanced } from "./validate-journal-entry-balanced.service";
import { JournalEntryNotBalancedError } from "../domain/errors/accounting.errors";
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";

describe("validateJournalEntryBalanced", () => {
  it("does not throw when total debit equals total credit", () => {
    expect(() =>
      validateJournalEntryBalanced([
        { debitAmount: DecimalValue.create("1000.00"), creditAmount: DecimalValue.create("0") },
        { debitAmount: DecimalValue.create("0"), creditAmount: DecimalValue.create("1000.00") },
      ]),
    ).not.toThrow();
  });

  it("does not throw for balanced amounts split across many lines with different decimal precisions", () => {
    expect(() =>
      validateJournalEntryBalanced([
        { debitAmount: DecimalValue.create("100.5"), creditAmount: DecimalValue.create("0") },
        { debitAmount: DecimalValue.create("0.25"), creditAmount: DecimalValue.create("0") },
        { debitAmount: DecimalValue.create("0"), creditAmount: DecimalValue.create("100.75") },
      ]),
    ).not.toThrow();
  });

  it("throws JournalEntryNotBalancedError when total debit does not equal total credit", () => {
    expect(() =>
      validateJournalEntryBalanced([
        { debitAmount: DecimalValue.create("1000.00"), creditAmount: DecimalValue.create("0") },
        { debitAmount: DecimalValue.create("0"), creditAmount: DecimalValue.create("999.00") },
      ]),
    ).toThrow(JournalEntryNotBalancedError);
  });

  it("reports the correct totals on the thrown error", () => {
    try {
      validateJournalEntryBalanced([
        { debitAmount: DecimalValue.create("1000.00"), creditAmount: DecimalValue.create("0") },
        { debitAmount: DecimalValue.create("0"), creditAmount: DecimalValue.create("999.00") },
      ]);
      fail("expected validateJournalEntryBalanced to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(JournalEntryNotBalancedError);
      expect((error as JournalEntryNotBalancedError).totalDebit).toBe("1000");
      expect((error as JournalEntryNotBalancedError).totalCredit).toBe("999");
    }
  });
});
