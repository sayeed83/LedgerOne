import { z } from "zod";
import { tenantIdSchema } from "./tenant-id.schema";

// Same interim `tenantId` gap as login.dto.ts — first contact, no prior token.
export const forgotPasswordRequestSchema = z.object({
  tenantId: tenantIdSchema,
  email: z.string().email(),
});

export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>;
