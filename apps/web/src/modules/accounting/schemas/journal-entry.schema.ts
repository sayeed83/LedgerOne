import { z } from "zod";
import { isoDateSchema, uuidSchema } from "./shared.schema";

const decimalOrEmpty = z
  .string()
  .regex(/^(\d+(\.\d{1,6})?)?$/, "Enter a valid amount.")
  .default("");

// A line must have exactly one of debit/credit populated with a positive
// amount — client convenience only; the backend re-validates the balanced-
// entry business rule regardless (FP4/FORM-002).
export const journalEntryLineFormSchema = z
  .object({
    accountUuid: uuidSchema,
    debitAmount: decimalOrEmpty,
    creditAmount: decimalOrEmpty,
  })
  .refine(
    (line) => {
      const debit = Number(line.debitAmount || 0);
      const credit = Number(line.creditAmount || 0);
      return (debit > 0) !== (credit > 0);
    },
    { message: "Enter either a debit or a credit amount, not both.", path: ["debitAmount"] },
  );

export const journalEntryFormSchema = z.object({
  companyUuid: uuidSchema,
  postingDate: isoDateSchema,
  narration: z.string().max(500, "Narration must be at most 500 characters.").optional(),
  lines: z.array(journalEntryLineFormSchema).min(2, "A Journal Entry needs at least 2 lines."),
});

export type JournalEntryLineFormValues = z.infer<typeof journalEntryLineFormSchema>;
export type JournalEntryFormValues = z.infer<typeof journalEntryFormSchema>;
