import { Request, Response } from "express";
import { createTenantSettings } from "../../../business/create-tenant-settings.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantUuidParamSchema } from "../../dto/requests/tenant-uuid.schema";
import { createTenantSettingsRequestSchema } from "../../dto/requests/create-tenant-settings.dto";
import { toTenantSettingsResponse } from "../../dto/responses/tenant-settings.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/organization/tenants/:tenantUuid/settings` — provisions the Tenant's organization-wide default settings (00_BUSINESS_RULES.md ORG-003/Ch.1.7). */
export function createTenantSettingsController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const params = tenantUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const body = createTenantSettingsRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const settings = await createTenantSettings(
      {
        tenantUuid: params.data.tenantUuid,
        defaultCurrencyCode: body.data.defaultCurrencyCode,
        defaultTimeZone: body.data.defaultTimeZone,
        defaultFinancialYearPattern: body.data.defaultFinancialYearPattern,
      },
      deps,
    );

    sendData(res, 201, toTenantSettingsResponse(settings));
  });
}
