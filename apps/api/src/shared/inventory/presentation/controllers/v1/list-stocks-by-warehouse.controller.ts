import { Request, Response } from "express";
import { listStocksByWarehouse } from "../../../business/list-stocks-by-warehouse.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listStocksByWarehouseQuerySchema } from "../../dto/requests/list-stocks-by-warehouse-query.dto";
import { toStockResponse } from "../../dto/responses/stock.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every list endpoint in this module.
/** `GET /api/v1/inventory/stocks?warehouseUuid=` — lists every Stock record belonging to a single Warehouse under the `X-Tenant-Id` tenant. `warehouseUuid` is required, not optional (mirrors the Business layer's own `listStocksByWarehouse` shape). */
export function listStocksByWarehouseController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listStocksByWarehouseQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const stocks = await listStocksByWarehouse(
      { tenantId: header.data["x-tenant-id"], warehouseUuid: query.data.warehouseUuid },
      deps,
    );

    sendData(res, 200, stocks.map(toStockResponse));
  });
}
