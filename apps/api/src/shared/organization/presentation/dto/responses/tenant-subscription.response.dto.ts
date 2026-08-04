import { z } from "zod";
import { TenantSubscriptionStatus } from "../../../business/organization-types";

export const tenantSubscriptionResponseSchema = z.object({
  uuid: z.string().uuid(),
  planCode: z.string(),
  subscribedModules: z.array(z.string()),
  status: z.nativeEnum(TenantSubscriptionStatus),
  currentPeriodStartsAt: z.date(),
  currentPeriodEndsAt: z.date(),
  cancelledAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TenantSubscriptionResponse = z.infer<typeof tenantSubscriptionResponseSchema>;

/** Structural rather than importing the Domain `TenantSubscription` type (Presentation must not import domain/, Ch.9.3). */
interface TenantSubscriptionLike {
  uuid: string;
  planCode: string;
  subscribedModules: string[];
  status: string;
  currentPeriodStartsAt: Date;
  currentPeriodEndsAt: Date;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toTenantSubscriptionResponse(subscription: TenantSubscriptionLike): TenantSubscriptionResponse {
  return {
    uuid: subscription.uuid,
    planCode: subscription.planCode,
    subscribedModules: subscription.subscribedModules,
    status: subscription.status as TenantSubscriptionStatus,
    currentPeriodStartsAt: subscription.currentPeriodStartsAt,
    currentPeriodEndsAt: subscription.currentPeriodEndsAt,
    cancelledAt: subscription.cancelledAt,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
}
