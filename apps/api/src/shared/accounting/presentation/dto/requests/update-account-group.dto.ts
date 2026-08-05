import { z } from "zod";
import { AccountType } from "../../../business/accounting-types";

// `parentAccountGroupUuid` is `nullable().optional()` — a documented,
// minimal choice to let a client distinguish "omit the field, leave the
// existing parent untouched" (`undefined`) from "explicitly clear the
// parent" (`null`); no existing precedent for this distinction was found
// elsewhere in this module (every other update DTO's optional fields are
// plain replace-if-present), so this is a locally new, narrowly-scoped Zod
// shape rather than an established repo-wide pattern.
export const updateAccountGroupRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  accountType: z.nativeEnum(AccountType).optional(),
  parentAccountGroupUuid: z.string().uuid().nullable().optional(),
});

export type UpdateAccountGroupRequest = z.infer<typeof updateAccountGroupRequestSchema>;
