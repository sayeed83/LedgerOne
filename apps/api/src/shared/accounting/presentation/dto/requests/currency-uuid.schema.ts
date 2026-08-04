import { z } from "zod";

// Path-param validator for `:currencyUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const currencyUuidParamSchema = z.object({
  currencyUuid: z.string().uuid(),
});

export type CurrencyUuidParam = z.infer<typeof currencyUuidParamSchema>;
