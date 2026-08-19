import { Request, Response } from "express";
import { getStockMovement } from "../../../business/get-stock-movement.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { stockMovementUuidParamSchema } from "../../dto/requests/stock-movement-uuid.schema";
import { toStockMovementResponse } from "../../dto/responses/stock-movement.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/inventory/stock-movements/:movementUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getStockMovementController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = stockMovementUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const stockMovement = await getStockMovement(
      { tenantId: header.data["x-tenant-id"], stockMovementUuid: params.data.movementUuid },
      deps,
    );

    sendData(res, 200, toStockMovementResponse(stockMovement));
  });
}
