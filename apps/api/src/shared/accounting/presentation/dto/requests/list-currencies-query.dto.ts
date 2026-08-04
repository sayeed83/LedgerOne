import { z } from "zod";
import { CurrencyStatus } from "../../../business/accounting-types";

// `status` is an optional query filter narrowing the platform-wide list to
// one lifecycle state (00_BUSINESS_RULES.md Ch.7.5/7.8), mirroring
// Authorization's list-permissions-query.dto.ts optional-filter shape.
export const listCurrenciesQuerySchema = z.object({
  status: z.nativeEnum(CurrencyStatus).optional(),
});

export type ListCurrenciesQuery = z.infer<typeof listCurrenciesQuerySchema>;
