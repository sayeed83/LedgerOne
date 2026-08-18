import { Request, Response } from "express";
import { updateWarehouse } from "../../../business/update-warehouse.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { warehouseUuidParamSchema } from "../../dto/requests/warehouse-uuid.schema";
import { updateWarehouseRequestSchema } from "../../dto/requests/update-warehouse.dto";
import { toWarehouseResponse } from "../../dto/responses/warehouse.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/inventory/warehouses/:warehouseUuid` — revises the Warehouse's code/name/description/status (00_BUSINESS_RULES.md Ch.37.5). */
export function updateWarehouseController(deps: InventoryDependencies) {
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

    const body = updateWarehouseRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const warehouse = await updateWarehouse(
      {
        tenantId: header.data["x-tenant-id"],
        warehouseUuid: params.data.warehouseUuid,
        warehouseCode: body.data.warehouseCode,
        name: body.data.name,
        description: body.data.description,
        status: body.data.status,
      },
      deps,
    );

    sendData(res, 200, toWarehouseResponse(warehouse));
  });
}
