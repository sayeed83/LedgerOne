import { z } from "zod";

// `createdBy` is an interim gap, same as Authentication's `tenantId` gap
// (see login.dto.ts) — there is no auth/session-resolution middleware wired
// up yet to supply an acting user id, so it is not accepted on the wire.
// Flagged, not invented.
export const createTenantRequestSchema = z.object({
  legalName: z.string().min(1),
  primaryContactEmail: z.string().email(),
});

export type CreateTenantRequest = z.infer<typeof createTenantRequestSchema>;
