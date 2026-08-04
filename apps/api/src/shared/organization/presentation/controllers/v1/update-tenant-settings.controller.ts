import { Request, Response } from "express";
import { updateTenantSettings } from "../../../business/update-tenant-settings.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantUuidParamSchema } from "../../dto/requests/tenant-uuid.schema";
import { updateTenantSettingsRequestSchema } from "../../dto/requests/update-tenant-settings.dto";
import { toTenantSettingsResponse } from "../../dto/responses/tenant-settings.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/organization/tenants/:tenantUuid/settings` — 00_BUSINESS_RULES.md ORG-003. */
export function updateTenantSettingsController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const params = tenantUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const body = updateTenantSettingsRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const settings = await updateTenantSettings(
      {
        tenantUuid: params.data.tenantUuid,
        defaultCurrencyCode: body.data.defaultCurrencyCode,
        defaultTimeZone: body.data.defaultTimeZone,
        defaultFinancialYearPattern: body.data.defaultFinancialYearPattern,
      },
      deps,
    );

    sendData(res, 200, toTenantSettingsResponse(settings));
  });
}
