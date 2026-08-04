import { z } from "zod";

// `tenantId` arrives via the `X-Tenant-Id` header (tenant-context, not
// Role-specific data). `isSystemRole` is deliberately not accepted from
// client input — it distinguishes LedgerOne's own platform-seeded standard
// Roles (00_BUSINESS_RULES.md ROL-002) from a tenant's custom Roles, and is
// never a tenant-settable flag (mirrors MT-004's "never trust a
// client-supplied tenant_id" posture applied to this platform-controlled
// attribute); every Role created through this endpoint defaults to false at
// the Business layer.
export const createRoleRequestSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).nullable().optional(),
});

export type CreateRoleRequest = z.infer<typeof createRoleRequestSchema>;
