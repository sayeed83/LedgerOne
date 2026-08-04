import { z } from "zod";

// Path-param validator for `:roleUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const roleUuidParamSchema = z.object({
  roleUuid: z.string().uuid(),
});

export type RoleUuidParam = z.infer<typeof roleUuidParamSchema>;
