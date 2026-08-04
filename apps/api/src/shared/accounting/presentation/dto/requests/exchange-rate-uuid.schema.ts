import { z } from "zod";

// Path-param validator for `:exchangeRateUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const exchangeRateUuidParamSchema = z.object({
  exchangeRateUuid: z.string().uuid(),
});

export type ExchangeRateUuidParam = z.infer<typeof exchangeRateUuidParamSchema>;
