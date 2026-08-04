import { z } from "zod";

// Path-param validator for `:companyUuid` (06_DATABASE_STANDARDS.md
// PK-002/PK-003 — the only identifier ever exposed across the API boundary).
export const companyUuidParamSchema = z.object({
  companyUuid: z.string().uuid(),
});

export type CompanyUuidParam = z.infer<typeof companyUuidParamSchema>;
