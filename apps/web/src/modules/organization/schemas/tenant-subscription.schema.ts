import { z } from "zod";
import { TenantSubscriptionStatus } from "@ledgerone/shared-types";

// Mirrors the backend's create/update-tenant-subscription.dto.ts field
// shapes (00_BUSINESS_RULES.md Ch.1.4/ORG-004). `subscribedModules` is
// entered as a comma-separated list in the form (the simplest input for an
// open-ended string array — no fixed module picker exists yet, ORG-004's
// module catalog isn't a built entity) and split/trimmed on submit, never
// in this schema itself (keeps the schema a pure string-shape validator).
// `status` is optional here — present only on the edit form; the create
// form never submits it (the backend rejects it as unknown-but-harmless
// extra input is not the concern — it simply isn't part of
// CreateTenantSubscriptionRequestDto's shape at all).
export const tenantSubscriptionFormSchema = z.object({
  planCode: z.string().min(1, "Plan code is required."),
  subscribedModules: z.string().min(1, "List at least one subscribed module."),
  currentPeriodStartsAt: z.string().min(1, "Start date is required."),
  currentPeriodEndsAt: z.string().min(1, "End date is required."),
  status: z.nativeEnum(TenantSubscriptionStatus).optional(),
});

export type TenantSubscriptionFormValues = z.infer<typeof tenantSubscriptionFormSchema>;
