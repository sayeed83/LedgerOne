import { z } from "zod";

// Tenant-context validator for endpoints that identify their resource by
// its own uuid (Company/Branch/Department) rather than by a `:tenantUuid`
// path segment. No tenant-context-resolution middleware exists yet in this
// codebase (deriving tenant from an authenticated session/JWT is a later,
// out-of-scope milestone per this task) — the `X-Tenant-Id` header is the
// interim, explicit substitute, validated the same way as any other input.
export const tenantIdHeaderSchema = z.object({
  "x-tenant-id": z.string().uuid(),
});

export type TenantIdHeader = z.infer<typeof tenantIdHeaderSchema>;
