import { z } from "zod";

// Path-param validator for `:branchUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const branchUuidParamSchema = z.object({
  branchUuid: z.string().uuid(),
});

export type BranchUuidParam = z.infer<typeof branchUuidParamSchema>;
