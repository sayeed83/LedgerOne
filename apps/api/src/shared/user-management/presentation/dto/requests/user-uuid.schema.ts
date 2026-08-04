import { z } from "zod";

// Path-param validator for `:userUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const userUuidParamSchema = z.object({
  userUuid: z.string().uuid(),
});

export type UserUuidParam = z.infer<typeof userUuidParamSchema>;
