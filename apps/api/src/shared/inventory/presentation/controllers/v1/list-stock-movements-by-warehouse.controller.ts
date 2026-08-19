import { Request, Response } from "express";
import { listStockMovementsByWarehouse } from "../../../business/list-stock-movements-by-warehouse.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listStockMovementsByWarehouseQuerySchema } from "../../dto/requests/list-stock-movements-by-warehouse-query.dto";
import { toStockMovementResponse } from "../../dto/responses/stock-movement.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every list endpoint in this module.
/** `GET /api/v1/inventory/stock-movements?warehouseUuid=` — lists every Stock Movement involving a single Warehouse, on either side (`sourceWarehouseUuid` or `destinationWarehouseUuid`), under the `X-Tenant-Id` tenant. `warehouseUuid` is required, not optional (mirrors the Business layer's own `listStockMovementsByWarehouse` shape). */
export function listStockMovementsByWarehouseController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listStockMovementsByWarehouseQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const stockMovements = await listStockMovementsByWarehouse(
      { tenantId: header.data["x-tenant-id"], warehouseUuid: query.data.warehouseUuid },
      deps,
    );

    sendData(res, 200, stockMovements.map(toStockMovementResponse));
  });
}
