import { z } from "zod";

// Path-param validator for `:userUuid` — a cross-module reference (FK-002)
// to User Management's `users.uuid`, never a numeric id
// (06_DATABASE_STANDARDS.md PK-002/PK-003).
export const userUuidParamSchema = z.object({
  userUuid: z.string().uuid(),
});

export type UserUuidParam = z.infer<typeof userUuidParamSchema>;
