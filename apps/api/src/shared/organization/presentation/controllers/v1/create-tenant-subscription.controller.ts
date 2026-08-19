import { Request, Response } from "express";
import { createTenantSubscription } from "../../../business/create-tenant-subscription.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantUuidParamSchema } from "../../dto/requests/tenant-uuid.schema";
import { createTenantSubscriptionRequestSchema } from "../../dto/requests/create-tenant-subscription.dto";
import { toTenantSubscriptionResponse } from "../../dto/responses/tenant-subscription.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/organization/tenants/:tenantUuid/subscription` — provisions the Tenant's commercial subscription record (00_BUSINESS_RULES.md Ch.1.4/ORG-004). */
export function createTenantSubscriptionController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const params = tenantUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const body = createTenantSubscriptionRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const subscription = await createTenantSubscription(
      {
        tenantUuid: params.data.tenantUuid,
        planCode: body.data.planCode,
        subscribedModules: body.data.subscribedModules,
        currentPeriodStartsAt: body.data.currentPeriodStartsAt,
        currentPeriodEndsAt: body.data.currentPeriodEndsAt,
      },
      deps,
    );

    sendData(res, 201, toTenantSubscriptionResponse(subscription));
  });
}
