import { Request, Response } from "express";
import { listBaseUnits } from "../../../business/list-base-units.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listBaseUnitsQuerySchema } from "../../dto/requests/list-base-units-query.dto";
import { toUnitResponse } from "../../dto/responses/unit.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every list endpoint in Accounting's own module.
/** `GET /api/v1/inventory/units/base-units?companyUuid=` — lists every base Unit (no `baseUnitId` of its own, Ch.36.1/36.11) for a single Company under the `X-Tenant-Id` tenant. */
export function listBaseUnitsController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listBaseUnitsQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const units = await listBaseUnits(
      { tenantId: header.data["x-tenant-id"], companyUuid: query.data.companyUuid },
      deps,
    );

    sendData(res, 200, units.map(toUnitResponse));
  });
}
