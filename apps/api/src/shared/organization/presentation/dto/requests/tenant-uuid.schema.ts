import { z } from "zod";

// Path-param validator for `:tenantUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const tenantUuidParamSchema = z.object({
  tenantUuid: z.string().uuid(),
});

export type TenantUuidParam = z.infer<typeof tenantUuidParamSchema>;
