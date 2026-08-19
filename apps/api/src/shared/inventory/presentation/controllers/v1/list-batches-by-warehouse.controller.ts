import { Request, Response } from "express";
import { listBatchesByWarehouse } from "../../../business/list-batches-by-warehouse.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listBatchesByWarehouseQuerySchema } from "../../dto/requests/list-batches-by-warehouse-query.dto";
import { toBatchResponse } from "../../dto/responses/batch.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every list endpoint in this module.
// This is the controller mounted at the module's one bare `GET /batches`
// route (per this milestone's own explicit instruction to register no more
// than 4 Batch routes) — mirroring Inventory Adjustment's/Stock Movement's
// own precedent of exposing only the by-Warehouse list at the bare list
// route, even though a by-Product list Business service also exists (see
// list-batches-by-product.controller.ts's own header comment).
/** `GET /api/v1/inventory/batches?warehouseUuid=` — lists every Batch belonging to a single Warehouse under the `X-Tenant-Id` tenant. `warehouseUuid` is required, not optional (mirrors the Business layer's own `listBatchesByWarehouse` shape). */
export function listBatchesByWarehouseController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listBatchesByWarehouseQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const batches = await listBatchesByWarehouse(
      { tenantId: header.data["x-tenant-id"], warehouseUuid: query.data.warehouseUuid },
      deps,
    );

    sendData(res, 200, batches.map(toBatchResponse));
  });
}
