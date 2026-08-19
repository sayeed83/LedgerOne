import { Request, Response } from "express";
import { listInventoryAdjustmentsByWarehouse } from "../../../business/list-inventory-adjustments-by-warehouse.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listInventoryAdjustmentsByWarehouseQuerySchema } from "../../dto/requests/list-inventory-adjustments-by-warehouse-query.dto";
import { toInventoryAdjustmentResponse } from "../../dto/responses/inventory-adjustment.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every list endpoint in this module.
/** `GET /api/v1/inventory/adjustments?warehouseUuid=` — lists every Inventory Adjustment belonging to a single Warehouse under the `X-Tenant-Id` tenant. `warehouseUuid` is required, not optional (mirrors the Business layer's own `listInventoryAdjustmentsByWarehouse` shape). */
export function listInventoryAdjustmentsByWarehouseController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listInventoryAdjustmentsByWarehouseQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const inventoryAdjustments = await listInventoryAdjustmentsByWarehouse(
      { tenantId: header.data["x-tenant-id"], warehouseUuid: query.data.warehouseUuid },
      deps,
    );

    sendData(res, 200, inventoryAdjustments.map(toInventoryAdjustmentResponse));
  });
}
