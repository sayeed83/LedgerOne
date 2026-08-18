import { z } from "zod";
import { isoDateSchema, moneyStringSchema, uuidSchema } from "./shared.schema";

// VAL-003: "must be a distinct pair" is re-validated server-side
// (ACC_EXCHANGE_RATE_PAIR_NOT_DISTINCT) even though checked here too — this
// client check is convenience only (FP4).
export const exchangeRateFormSchema = z
  .object({
    fromCurrencyUuid: uuidSchema,
    toCurrencyUuid: uuidSchema,
    rate: moneyStringSchema,
    effectiveDate: isoDateSchema,
  })
  .refine((values) => values.fromCurrencyUuid !== values.toCurrencyUuid, {
    message: "From and To currencies must be different.",
    path: ["toCurrencyUuid"],
  });

export type ExchangeRateFormValues = z.infer<typeof exchangeRateFormSchema>;
