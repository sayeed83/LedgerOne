import { Request, Response } from "express";
import { listReorderLevelsByCompany } from "../../../business/list-reorder-levels-by-company.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listReorderLevelsByCompanyQuerySchema } from "../../dto/requests/list-reorder-levels-by-company-query.dto";
import { toReorderLevelResponse } from "../../dto/responses/reorder-level.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every list endpoint in this module. This
// is the controller mounted at the module's bare `GET /reorder-levels` route
// — mirroring Product's/Unit's/Warehouse's own precedent of a Company (or
// Branch)-scoped list at the bare list route, with the Warehouse-scoped
// variant (list-reorder-levels-by-warehouse.controller.ts) mounted at its
// own static sub-path, mirroring Unit's own `/units` + `/units/base-units`
// two-list-variant precedent.
/** `GET /api/v1/inventory/reorder-levels?companyUuid=` — lists every Reorder Level belonging to a single Company, across every Warehouse, under the `X-Tenant-Id` tenant. `companyUuid` is required, not optional (mirrors the Business layer's own `listReorderLevelsByCompany` shape). */
export function listReorderLevelsByCompanyController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listReorderLevelsByCompanyQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const reorderLevels = await listReorderLevelsByCompany(
      { tenantId: header.data["x-tenant-id"], companyUuid: query.data.companyUuid },
      deps,
    );

    sendData(res, 200, reorderLevels.map(toReorderLevelResponse));
  });
}
