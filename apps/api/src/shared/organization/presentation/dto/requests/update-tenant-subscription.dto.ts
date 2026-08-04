import { z } from "zod";
import { TenantSubscriptionStatus } from "../../../business/organization-types";

// `status` validates against the exact persisted enum values
// (05_CODING_STANDARDS.md Ch.26.4) via the Business layer's re-export
// (never a domain/ import directly, per Ch.9.3).
export const updateTenantSubscriptionRequestSchema = z.object({
  planCode: z.string().min(1).optional(),
  subscribedModules: z.array(z.string().min(1)).optional(),
  status: z.nativeEnum(TenantSubscriptionStatus).optional(),
  currentPeriodStartsAt: z.coerce.date().optional(),
  currentPeriodEndsAt: z.coerce.date().optional(),
  cancelledAt: z.coerce.date().nullable().optional(),
});

export type UpdateTenantSubscriptionRequest = z.infer<typeof updateTenantSubscriptionRequestSchema>;
