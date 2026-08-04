import { Request, Response } from "express";
import { getTenantSettings } from "../../../business/get-tenant-settings.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantUuidParamSchema } from "../../dto/requests/tenant-uuid.schema";
import { toTenantSettingsResponse } from "../../dto/responses/tenant-settings.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/organization/tenants/:tenantUuid/settings` */
export function getTenantSettingsController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const parsed = tenantUuidParamSchema.safeParse(req.params);
    if (!parsed.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", parsed.error.issues);
      return;
    }

    const settings = await getTenantSettings({ tenantUuid: parsed.data.tenantUuid }, deps);

    sendData(res, 200, toTenantSettingsResponse(settings));
  });
}
