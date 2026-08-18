import { z } from "zod";

// VAL-004: shared, human-readable validators reused across every Accounting
// form's money/date fields — never a raw Zod default message shown to the
// user. FORM-004: money stays a decimal string end-to-end, never coerced to
// a JS number.
export const moneyStringSchema = z
  .string()
  .min(1, "Amount is required.")
  .regex(/^\d+(\.\d{1,6})?$/, "Enter a valid amount (e.g. 100.00).");

export const nonNegativeMoneyStringSchema = moneyStringSchema;

export const uuidSchema = z.string().uuid("Select a valid option.");

export const isoDateSchema = z.string().min(1, "Date is required.");
