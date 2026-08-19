import { Request, Response } from "express";
import { listReorderLevelsByWarehouse } from "../../../business/list-reorder-levels-by-warehouse.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listReorderLevelsByWarehouseQuerySchema } from "../../dto/requests/list-reorder-levels-by-warehouse-query.dto";
import { toReorderLevelResponse } from "../../dto/responses/reorder-level.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every list endpoint in this module. Mounted
// at the static `GET /reorder-levels/by-warehouse` sub-path — the module's
// bare `GET /reorder-levels` route is already taken by the Company-scoped
// list (list-reorder-levels-by-company.controller.ts), so this second,
// equally-authorized list variant is exposed at its own static segment,
// registered before the `:reorderLevelUuid` param route (mirroring Unit's
// own `/units/base-units`-before-`/units/:unitUuid` ordering exactly, so
// Express never matches this literal segment as a `reorderLevelUuid`).
/** `GET /api/v1/inventory/reorder-levels/by-warehouse?warehouseUuid=` — lists every Reorder Level belonging to a single Warehouse under the `X-Tenant-Id` tenant. `warehouseUuid` is required, not optional (mirrors the Business layer's own `listReorderLevelsByWarehouse` shape). */
export function listReorderLevelsByWarehouseController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listReorderLevelsByWarehouseQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const reorderLevels = await listReorderLevelsByWarehouse(
      { tenantId: header.data["x-tenant-id"], warehouseUuid: query.data.warehouseUuid },
      deps,
    );

    sendData(res, 200, reorderLevels.map(toReorderLevelResponse));
  });
}
