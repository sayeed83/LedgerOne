import { z } from "zod";

// Path-param validator for `:customerUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const customerUuidParamSchema = z.object({
  customerUuid: z.string().uuid(),
});

export type CustomerUuidParam = z.infer<typeof customerUuidParamSchema>;
