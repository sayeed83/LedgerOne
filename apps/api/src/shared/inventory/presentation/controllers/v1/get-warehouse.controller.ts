import { Request, Response } from "express";
import { getWarehouse } from "../../../business/get-warehouse.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { warehouseUuidParamSchema } from "../../dto/requests/warehouse-uuid.schema";
import { toWarehouseResponse } from "../../dto/responses/warehouse.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/inventory/warehouses/:warehouseUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getWarehouseController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = warehouseUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const warehouse = await getWarehouse(
      { tenantId: header.data["x-tenant-id"], warehouseUuid: params.data.warehouseUuid },
      deps,
    );

    sendData(res, 200, toWarehouseResponse(warehouse));
  });
}
