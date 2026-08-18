import { Request, Response } from "express";
import { createStock } from "../../../business/create-stock.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createStockRequestSchema } from "../../dto/requests/create-stock.dto";
import { toStockResponse } from "../../dto/responses/stock.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/inventory/stocks` — defines a new Stock record for a Product in a Warehouse under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md Ch.38.1). */
export function createStockController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createStockRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const stock = await createStock(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
        warehouseUuid: body.data.warehouseUuid,
        productId: body.data.productId,
        quantityOnHand: body.data.quantityOnHand,
        quantityReserved: body.data.quantityReserved,
        quantityAvailable: body.data.quantityAvailable,
      },
      deps,
    );

    sendData(res, 201, toStockResponse(stock));
  });
}
