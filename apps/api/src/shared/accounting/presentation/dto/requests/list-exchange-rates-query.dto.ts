import { z } from "zod";

// `fromCurrencyUuid`/`toCurrencyUuid` are optional query filters narrowing
// the tenant-wide list to one currency pair, mirroring
// list-financial-years-query.dto.ts's optional-filter shape.
export const listExchangeRatesQuerySchema = z.object({
  fromCurrencyUuid: z.string().uuid().optional(),
  toCurrencyUuid: z.string().uuid().optional(),
});

export type ListExchangeRatesQuery = z.infer<typeof listExchangeRatesQuerySchema>;
