import { Request, Response } from "express";
import { createInventoryAdjustment } from "../../../business/create-inventory-adjustment.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createInventoryAdjustmentRequestSchema } from "../../dto/requests/create-inventory-adjustment.dto";
import { toInventoryAdjustmentResponse } from "../../dto/responses/inventory-adjustment.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/inventory/adjustments` — records a new Inventory Adjustment (00_BUSINESS_RULES.md Ch.44) under the `X-Tenant-Id` tenant. */
export function createInventoryAdjustmentController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createInventoryAdjustmentRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const inventoryAdjustment = await createInventoryAdjustment(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
        warehouseUuid: body.data.warehouseUuid,
        productId: body.data.productId,
        adjustmentType: body.data.adjustmentType,
        quantity: body.data.quantity,
        reason: body.data.reason,
        remarks: body.data.remarks,
      },
      deps,
    );

    sendData(res, 201, toInventoryAdjustmentResponse(inventoryAdjustment));
  });
}
