import { Request, Response } from "express";
import { updateStock } from "../../../business/update-stock.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { stockUuidParamSchema } from "../../dto/requests/stock-uuid.schema";
import { updateStockRequestSchema } from "../../dto/requests/update-stock.dto";
import { toStockResponse } from "../../dto/responses/stock.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/inventory/stocks/:stockUuid` — revises the Stock's quantities (00_BUSINESS_RULES.md Ch.38.3). */
export function updateStockController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = stockUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const body = updateStockRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const stock = await updateStock(
      {
        tenantId: header.data["x-tenant-id"],
        stockUuid: params.data.stockUuid,
        warehouseUuid: body.data.warehouseUuid,
        productId: body.data.productId,
        quantityOnHand: body.data.quantityOnHand,
        quantityReserved: body.data.quantityReserved,
        quantityAvailable: body.data.quantityAvailable,
      },
      deps,
    );

    sendData(res, 200, toStockResponse(stock));
  });
}
