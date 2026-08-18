import { z } from "zod";
import { isoDateSchema, uuidSchema } from "./shared.schema";

export const taxRuleFormSchema = z.object({
  taxGroupUuid: uuidSchema,
  rate: z
    .string()
    .min(1, "Rate is required.")
    .regex(/^\d+(\.\d{1,6})?$/, "Enter a valid non-negative rate (e.g. 18.00)."),
  effectiveFrom: isoDateSchema,
  effectiveTo: z.string().optional(),
});

export type TaxRuleFormValues = z.infer<typeof taxRuleFormSchema>;
