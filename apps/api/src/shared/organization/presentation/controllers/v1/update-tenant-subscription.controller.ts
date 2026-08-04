import { Request, Response } from "express";
import { updateTenantSubscription } from "../../../business/update-tenant-subscription.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantUuidParamSchema } from "../../dto/requests/tenant-uuid.schema";
import { updateTenantSubscriptionRequestSchema } from "../../dto/requests/update-tenant-subscription.dto";
import { toTenantSubscriptionResponse } from "../../dto/responses/tenant-subscription.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/organization/tenants/:tenantUuid/subscription` — 00_BUSINESS_RULES.md Ch.1.4/ORG-004. */
export function updateTenantSubscriptionController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const params = tenantUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const body = updateTenantSubscriptionRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const subscription = await updateTenantSubscription(
      {
        tenantUuid: params.data.tenantUuid,
        planCode: body.data.planCode,
        subscribedModules: body.data.subscribedModules,
        status: body.data.status,
        currentPeriodStartsAt: body.data.currentPeriodStartsAt,
        currentPeriodEndsAt: body.data.currentPeriodEndsAt,
        cancelledAt: body.data.cancelledAt,
      },
      deps,
    );

    sendData(res, 200, toTenantSubscriptionResponse(subscription));
  });
}
