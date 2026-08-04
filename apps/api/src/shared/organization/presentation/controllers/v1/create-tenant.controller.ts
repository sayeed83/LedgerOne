import { Request, Response } from "express";
import { createTenant } from "../../../business/create-tenant.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { createTenantRequestSchema } from "../../dto/requests/create-tenant.dto";
import { toTenantResponse } from "../../dto/responses/tenant.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/organization/tenants` — provisions a new Tenant (00_BUSINESS_RULES.md Ch.1.6). */
export function createTenantController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const parsed = createTenantRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", parsed.error.issues);
      return;
    }

    const tenant = await createTenant(
      { legalName: parsed.data.legalName, primaryContactEmail: parsed.data.primaryContactEmail },
      deps,
    );

    sendData(res, 201, toTenantResponse(tenant));
  });
}
