import { z } from "zod";

// Tenant-context validator for this module's endpoints. Accounting does not
// own Tenant (Organization does) — mirroring User Management's and
// Authorization's own `tenant-id-header.schema.ts` exactly, for the
// identical reason (they don't own Tenant either). Combines the
// `X-Tenant-Id` header (works for every HTTP method, including the `GET`
// endpoints this module exposes with no body to carry a value in) with the
// decimal `tenantId` string the Business layer's `tenantId: bigint` input
// shape expects. Not a new tenant-resolution mechanism — the same interim
// measure already used by User Management/Authorization, and the real
// mechanism remains undesigned per those files' own comments.
export const tenantIdHeaderSchema = z.object({
  "x-tenant-id": z
    .string()
    .regex(/^\d+$/, "x-tenant-id must be a numeric string")
    .transform((value) => BigInt(value)),
});

export type TenantIdHeader = z.infer<typeof tenantIdHeaderSchema>;
