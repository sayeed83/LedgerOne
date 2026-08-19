import { Request, Response } from "express";
import { getInventoryAdjustment } from "../../../business/get-inventory-adjustment.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { inventoryAdjustmentUuidParamSchema } from "../../dto/requests/inventory-adjustment-uuid.schema";
import { toInventoryAdjustmentResponse } from "../../dto/responses/inventory-adjustment.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/inventory/adjustments/:adjustmentUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getInventoryAdjustmentController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = inventoryAdjustmentUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const inventoryAdjustment = await getInventoryAdjustment(
      { tenantId: header.data["x-tenant-id"], inventoryAdjustmentUuid: params.data.adjustmentUuid },
      deps,
    );

    sendData(res, 200, toInventoryAdjustmentResponse(inventoryAdjustment));
  });
}
