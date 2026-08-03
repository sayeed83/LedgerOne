import { z } from "zod";
import { tenantIdSchema } from "./tenant-id.schema";

// Same interim `tenantId` gap as login.dto.ts — the reset token is an
// opaque DB-stored value (not a JWT), so there is nothing to peek a tenant
// claim from either. Password length/composition (PWD-003) is enforced by
// the Business layer (assertPasswordMeetsPolicy), not duplicated here —
// this schema only enforces wire-level shape (non-empty string).
export const resetPasswordRequestSchema = z.object({
  tenantId: tenantIdSchema,
  token: z.string().min(1),
  newPassword: z.string().min(1),
});

export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>;
