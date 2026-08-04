import { z } from "zod";

// Path-param validator for `:taxRuleUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const taxRuleUuidParamSchema = z.object({
  taxRuleUuid: z.string().uuid(),
});

export type TaxRuleUuidParam = z.infer<typeof taxRuleUuidParamSchema>;
