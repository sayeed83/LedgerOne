import { z } from "zod";

// `isoCode` is never revised here — Currency's ISO code is its stable
// identity (00_BUSINESS_RULES.md Ch.7.3). Status is never changed here (see
// activate/deactivate-currency.controller.ts).
export const updateCurrencyRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  symbol: z.string().min(1).max(10).optional(),
  decimalPrecision: z.number().int().min(0).max(255).optional(),
});

export type UpdateCurrencyRequest = z.infer<typeof updateCurrencyRequestSchema>;
