import { Request, Response } from "express";
import { activateTenant } from "../../../business/activate-tenant.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantUuidParamSchema } from "../../dto/requests/tenant-uuid.schema";
import { toTenantResponse } from "../../dto/responses/tenant.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/organization/tenants/:tenantUuid/activate` — 00_BUSINESS_RULES.md Ch.1.6: Provisioning/Suspended -> Active. */
export function activateTenantController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const parsed = tenantUuidParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", parsed.error.issues);
      return;
    }

    const tenant = await activateTenant({ tenantUuid: parsed.data.tenantUuid }, deps);

    sendData(res, 200, toTenantResponse(tenant));
  });
}
