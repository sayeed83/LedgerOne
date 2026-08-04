import { z } from "zod";

// Path-param validator for `:fiscalPeriodUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary),
// mirroring financial-year-uuid.schema.ts.
export const fiscalPeriodUuidParamSchema = z.object({
  fiscalPeriodUuid: z.string().uuid(),
});

export type FiscalPeriodUuidParam = z.infer<typeof fiscalPeriodUuidParamSchema>;
