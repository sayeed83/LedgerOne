// Business layer — enforces 00_BUSINESS_RULES.md Ch.16 DBL-001: "Every
// Journal Entry must have total debit amount exactly equal to total credit
// amount before it can be Posted — this is a hard, non-negotiable invariant
// with zero business exception." Pure/read-only — no Repository dependency.
//
// `DecimalValue` (domain/value-objects/decimal-value.value-object.ts) is
// deliberately built with no arithmetic ("usage-justified only" — no caller
// needed it until now) and this milestone must not add any (no `Money`
// Value Object, no new `DecimalValue` methods, per the frozen architecture).
// Summation is therefore done here, locally, via exact scaled-`BigInt`
// arithmetic over each amount's own decimal string (never `Number`, per
// 06_DATABASE_STANDARDS.md P4 — floating point cannot represent arbitrary
// decimal fractions exactly) — then the two totals are compared using
// `DecimalValue.create(...).equals(...)`, reusing the existing Value
// Object for the actual equality check rather than raw string/bigint
// comparison, per the instruction to reuse `DecimalValue` where appropriate.
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
import { JournalEntryNotBalancedError } from "../domain/errors/accounting.errors";

export interface JournalEntryLineAmounts {
  debitAmount: DecimalValue;
  creditAmount: DecimalValue;
}

/** Sums a list of exact decimal strings without floating-point error, via `BigInt` scaled to the widest fractional precision present. */
function sumDecimalValues(values: DecimalValue[]): DecimalValue {
  const raw = values.map((value) => value.toString());
  const scale = raw.reduce((max, value) => {
    const fractionLength = value.includes(".") ? (value.split(".")[1]?.length ?? 0) : 0;
    return Math.max(max, fractionLength);
  }, 0);

  const scaleFactor = 10n ** BigInt(scale);
  const totalScaled = raw.reduce((total, value) => total + toScaledBigInt(value, scale), 0n);

  const wholePart = totalScaled / scaleFactor;
  const fractionPart = (totalScaled % scaleFactor < 0n ? -(totalScaled % scaleFactor) : totalScaled % scaleFactor)
    .toString()
    .padStart(scale, "0");

  const sum = scale > 0 ? `${wholePart.toString()}.${fractionPart}` : wholePart.toString();
  return DecimalValue.create(sum);
}

function toScaledBigInt(decimal: string, scale: number): bigint {
  const negative = decimal.startsWith("-");
  const unsigned = negative ? decimal.slice(1) : decimal;
  const [whole, fraction = ""] = unsigned.split(".");
  const scaled = BigInt(whole + fraction.padEnd(scale, "0"));
  return negative ? -scaled : scaled;
}

export function validateJournalEntryBalanced(lines: JournalEntryLineAmounts[]): void {
  const totalDebit = sumDecimalValues(lines.map((line) => line.debitAmount));
  const totalCredit = sumDecimalValues(lines.map((line) => line.creditAmount));

  if (!totalDebit.equals(totalCredit)) {
    throw new JournalEntryNotBalancedError(totalDebit.toString(), totalCredit.toString());
  }
}
