import { z } from "zod";
import { tenantIdSchema } from "./tenant-id.schema";

// `tenantId` here is an interim gap (see support/peek-tenant-id.ts) — login
// is first contact, so there is no prior token to resolve it from, and no
// tenant-resolution mechanism (subdomain, X-Tenant-Id, etc.) is documented
// anywhere in the handbook yet. Flagged, not invented.
export const loginRequestSchema = z.object({
  tenantId: tenantIdSchema,
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
