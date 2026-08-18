import { Request, Response } from "express";
import { listUnitsByCompany } from "../../../business/list-units-by-company.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listUnitsByCompanyQuerySchema } from "../../dto/requests/list-units-by-company-query.dto";
import { toUnitResponse } from "../../dto/responses/unit.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every list endpoint in Accounting's own module.
/** `GET /api/v1/inventory/units?companyUuid=` — lists every Unit belonging to a single Company under the `X-Tenant-Id` tenant. `companyUuid` is required, not optional (mirrors the Business layer's own `listUnitsByCompany` shape). */
export function listUnitsByCompanyController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listUnitsByCompanyQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const units = await listUnitsByCompany(
      { tenantId: header.data["x-tenant-id"], companyUuid: query.data.companyUuid },
      deps,
    );

    sendData(res, 200, units.map(toUnitResponse));
  });
}
