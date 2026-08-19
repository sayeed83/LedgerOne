import { Request, Response } from "express";
import { createStockMovement } from "../../../business/create-stock-movement.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createStockMovementRequestSchema } from "../../dto/requests/create-stock-movement.dto";
import { toStockMovementResponse } from "../../dto/responses/stock-movement.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/inventory/stock-movements` — records a new Stock Movement (00_BUSINESS_RULES.md Ch.39) under the `X-Tenant-Id` tenant. Immutable once recorded (Ch.39.5/STM-002) — there is no corresponding update endpoint. */
export function createStockMovementController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createStockMovementRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const stockMovement = await createStockMovement(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
        productId: body.data.productId,
        sourceWarehouseUuid: body.data.sourceWarehouseUuid,
        destinationWarehouseUuid: body.data.destinationWarehouseUuid,
        movementType: body.data.movementType,
        quantity: body.data.quantity,
        referenceType: body.data.referenceType,
        referenceUuid: body.data.referenceUuid,
      },
      deps,
    );

    sendData(res, 201, toStockMovementResponse(stockMovement));
  });
}
