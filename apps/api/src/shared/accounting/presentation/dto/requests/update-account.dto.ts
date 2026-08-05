import { z } from "zod";

// No `code`/`accountType` — Ch.17.7 COA-004 makes `code` a never-reused
// identity, and COA-001 makes `accountType` immutable once posted;
// deliberately excluded here, mirroring `UpdateAccountProps`'s identical
// exclusion at the Repository layer. `parentAccountUuid` is
// `nullable().optional()`, same explicit-null-vs-omitted distinction as
// update-account-group.dto.ts's `parentAccountGroupUuid`.
export const updateAccountRequestSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  accountGroupUuid: z.string().uuid().optional(),
  parentAccountUuid: z.string().uuid().nullable().optional(),
  isPostingAccount: z.boolean().optional(),
});

export type UpdateAccountRequest = z.infer<typeof updateAccountRequestSchema>;
