import { z } from "zod";

// Path-param validator for `:financialYearUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const financialYearUuidParamSchema = z.object({
  financialYearUuid: z.string().uuid(),
});

export type FinancialYearUuidParam = z.infer<typeof financialYearUuidParamSchema>;
