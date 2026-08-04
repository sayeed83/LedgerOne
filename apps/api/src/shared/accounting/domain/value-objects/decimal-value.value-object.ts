import { InvalidDecimalValueError } from "../errors/accounting.errors";

// Domain Value Object for an exact decimal numeric value
// (03_ARCHITECTURE.md Ch.7.3.2 — "An object defined entirely by its
// attributes, with no independent identity... Value Objects are immutable:
// a Money value is never mutated in place, a new one is produced.").
// Ch.7.3.6's worked example models Money as `{ amount: decimal, currency:
// string }` — this Value Object exists to represent that `amount: decimal`
// primitive properly, as LedgerOne's Accounting Domain's first precise
// numeric concept, rather than as a raw string or a JS `number`.
//
// Stored and compared as a normalized decimal STRING, never a JS `number`:
// IEEE 754 floats cannot represent arbitrary decimal fractions exactly,
// which is precisely why the Database layer uses MySQL `DECIMAL` columns,
// never `FLOAT` (00_BUSINESS_RULES.md Ch.7/CUR-003 — Currency decimal
// precision; Ch.31/EXR-001 — Exchange Rate values). No third-party
// arbitrary-precision math library is used — none is part of the frozen
// tech stack (02_TECH_STACK.md), and adding one would need an ADR
// (CLAUDE.md Section 14); this Value Object needs no arithmetic today; see
// the class-level "NOT implemented" note below.
//
// Zero framework/infrastructure imports (05_CODING_STANDARDS.md Ch.15.3) —
// no Prisma, no Express, no Zod. Constructed via a named static factory
// enforcing its invariant (a well-formed decimal string) at construction
// time, never via a public constructor (Ch.15.5).
//
// This is LedgerOne's first Domain Value Object and is intended as the
// building block a future `Money` Value Object composes on top of
// (`amount: DecimalValue` + a currency reference), mirroring
// 03_ARCHITECTURE.md Ch.7.3.6's `Money` shape, and is expected to be reused
// wherever the Accounting Domain needs an exact decimal (Exchange Rate
// today; Journal Entry amounts, ledger balances, tax rates, etc. in later
// modules) — without redesign.
//
// Deliberately NOT implemented: arithmetic (`add`/`multiply`/etc.),
// `compare()`/ordering, currency awareness, rounding/precision rules. No
// current caller needs any of these — Ch.31.12's "most recently effective
// rate" lookup is an explicitly deferred Business-layer concern, and
// CUR-003's per-currency precision rule is a Currency-specific validation,
// not a property of this generic Value Object. Adding them now would be
// speculative, not usage-justified (05_CODING_STANDARDS.md Ch.2 Principle
// "don't build for hypothetical future requirements"). `isPositive()` is
// the one narrow query added beyond the original three — 00_BUSINESS_RULES.md
// Ch.31.8 explicitly requires "Rate value must be a positive number", and
// this is that validation's actual first real caller
// (business/create-exchange-rate.service.ts), not a speculative addition.
export class DecimalValue {
  private constructor(private readonly value: string) {}

  /** Constructs a `DecimalValue` from an exact decimal string (e.g. a Prisma `Decimal`'s own fixed-notation string), normalizing to a canonical form so equal values compare equal regardless of formatting (e.g. `"0.90"` and `"0.9"`). Throws `InvalidDecimalValueError` if `raw` is not a well-formed decimal number. */
  static create(raw: string): DecimalValue {
    if (!DECIMAL_PATTERN.test(raw)) {
      throw new InvalidDecimalValueError(raw);
    }
    return new DecimalValue(normalize(raw));
  }

  /** The canonical decimal string representation — also what a Repository passes back to Prisma's `Decimal` input (string-accepting) when persisting. */
  toString(): string {
    return this.value;
  }

  /** Value equality (03_ARCHITECTURE.md Ch.7.3.2 — Value Objects with the same attributes are interchangeable), compared on the canonical normalized form. */
  equals(other: DecimalValue): boolean {
    return this.value === other.value;
  }

  /** True if the value is strictly greater than zero (00_BUSINESS_RULES.md Ch.31.8 — "Rate value must be a positive number"). */
  isPositive(): boolean {
    return !this.value.startsWith("-") && this.value !== "0";
  }
}

const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

function normalize(raw: string): string {
  const negative = raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;
  const parts = unsigned.split(".");
  const wholePart = parts[0] ?? "0";
  const fractionalPart = parts[1] ?? "";
  const trimmedWhole = wholePart.replace(/^0+(?=\d)/, "");
  const trimmedFraction = fractionalPart.replace(/0+$/, "");
  const isZero = trimmedWhole === "0" && trimmedFraction === "";
  const sign = negative && !isZero ? "-" : "";
  return `${sign}${trimmedWhole}${trimmedFraction ? `.${trimmedFraction}` : ""}`;
}
