import { Request, Response } from "express";
import { createWarehouse } from "../../../business/create-warehouse.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createWarehouseRequestSchema } from "../../dto/requests/create-warehouse.dto";
import { toWarehouseResponse } from "../../dto/responses/warehouse.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/inventory/warehouses` — defines a new Warehouse within a Branch under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md Ch.37.1). */
export function createWarehouseController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createWarehouseRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const warehouse = await createWarehouse(
      {
        tenantId: header.data["x-tenant-id"],
        branchUuid: body.data.branchUuid,
        warehouseCode: body.data.warehouseCode,
        name: body.data.name,
        description: body.data.description,
        status: body.data.status,
      },
      deps,
    );

    sendData(res, 201, toWarehouseResponse(warehouse));
  });
}
