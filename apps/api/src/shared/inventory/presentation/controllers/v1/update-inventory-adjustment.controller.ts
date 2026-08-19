import { Request, Response } from "express";
import { updateInventoryAdjustment } from "../../../business/update-inventory-adjustment.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { inventoryAdjustmentUuidParamSchema } from "../../dto/requests/inventory-adjustment-uuid.schema";
import { updateInventoryAdjustmentRequestSchema } from "../../dto/requests/update-inventory-adjustment.dto";
import { toInventoryAdjustmentResponse } from "../../dto/responses/inventory-adjustment.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/inventory/adjustments/:adjustmentUuid` — revises the Inventory Adjustment's own editable fields (quantity/reason/remarks). Never modifies Stock, never creates a Journal Entry. */
export function updateInventoryAdjustmentController(deps: InventoryDependencies) {
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

    const body = updateInventoryAdjustmentRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const inventoryAdjustment = await updateInventoryAdjustment(
      {
        tenantId: header.data["x-tenant-id"],
        inventoryAdjustmentUuid: params.data.adjustmentUuid,
        quantity: body.data.quantity,
        reason: body.data.reason,
        remarks: body.data.remarks,
      },
      deps,
    );

    sendData(res, 200, toInventoryAdjustmentResponse(inventoryAdjustment));
  });
}
