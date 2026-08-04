import { z } from "zod";

// Path-param validator for `:departmentUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const departmentUuidParamSchema = z.object({
  departmentUuid: z.string().uuid(),
});

export type DepartmentUuidParam = z.infer<typeof departmentUuidParamSchema>;
