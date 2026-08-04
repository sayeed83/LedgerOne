import { Request, Response } from "express";
import { updateTenant } from "../../../business/update-tenant.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantUuidParamSchema } from "../../dto/requests/tenant-uuid.schema";
import { updateTenantRequestSchema } from "../../dto/requests/update-tenant.dto";
import { toTenantResponse } from "../../dto/responses/tenant.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/organization/tenants/:tenantUuid` — revises identifying details only (00_BUSINESS_RULES.md Ch.1.9); status changes go through the dedicated activate/suspend/deactivate endpoints. */
export function updateTenantController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const params = tenantUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const body = updateTenantRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const tenant = await updateTenant(
      {
        tenantUuid: params.data.tenantUuid,
        legalName: body.data.legalName,
        primaryContactEmail: body.data.primaryContactEmail,
      },
      deps,
    );

    sendData(res, 200, toTenantResponse(tenant));
  });
}
