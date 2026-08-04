import { z } from "zod";

// Tenant-context validator for this module's endpoints. Neither of the two
// tenant-resolution mechanisms already in the codebase applies cleanly
// here: Organization's `X-Tenant-Id: <uuid>` (organization/presentation/dto
// /requests/tenant-id-header.schema.ts) works because Organization owns
// Tenant and can resolve a uuid to its internal id itself; Authentication's
// numeric-string `tenantId` (authentication/.../tenant-id.schema.ts) is
// delivered in the request body because login/forgot-password have no
// prior token to peek it from. User Management is in Authentication's
// position (it doesn't own Tenant either, so it needs the numeric id
// directly, not a uuid it has no way to resolve) but has mostly GET
// endpoints with no body to carry it in — so this combines the two: the
// `X-Tenant-Id` header (works for every HTTP method) carrying the decimal
// `tenantId` string (matches the Business layer's `tenantId: bigint` input
// shape, Ch.16.5 — DTO type inferred from its Zod schema). A third, equally
// explicit interim measure, not a new architectural decision — the real
// tenant-resolution mechanism remains undesigned per both existing files'
// own comments.
export const tenantIdHeaderSchema = z.object({
  "x-tenant-id": z
    .string()
    .regex(/^\d+$/, "x-tenant-id must be a numeric string")
    .transform((value) => BigInt(value)),
});

export type TenantIdHeader = z.infer<typeof tenantIdHeaderSchema>;
