import { Request, Response } from "express";
import { getTenantSubscription } from "../../../business/get-tenant-subscription.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantUuidParamSchema } from "../../dto/requests/tenant-uuid.schema";
import { toTenantSubscriptionResponse } from "../../dto/responses/tenant-subscription.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/organization/tenants/:tenantUuid/subscription` */
export function getTenantSubscriptionController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const parsed = tenantUuidParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", parsed.error.issues);
      return;
    }

    const subscription = await getTenantSubscription({ tenantUuid: parsed.data.tenantUuid }, deps);

    sendData(res, 200, toTenantSubscriptionResponse(subscription));
  });
}
