import { z } from "zod";

// 00_BUSINESS_RULES.md Ch.1.4/ORG-004: `planCode`/`subscribedModules`/period
// dates are all required at creation — no default plan or module list is
// documented (Ch.1.22 defers subscription self-service as future work).
// `status` is deliberately NOT accepted here — it always starts at its
// schema default (Provisioning), mirroring `create-role.dto.ts`'s own
// documented `isSystemRole` omission for a platform-controlled attribute;
// only `update-tenant-subscription.dto.ts`'s own `status` field may change
// it later.
export const createTenantSubscriptionRequestSchema = z.object({
  planCode: z.string().min(1),
  subscribedModules: z.array(z.string().min(1)),
  currentPeriodStartsAt: z.coerce.date(),
  currentPeriodEndsAt: z.coerce.date(),
});

export type CreateTenantSubscriptionRequest = z.infer<typeof createTenantSubscriptionRequestSchema>;
