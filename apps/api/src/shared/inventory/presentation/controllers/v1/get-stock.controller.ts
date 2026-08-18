import { Request, Response } from "express";
import { getStock } from "../../../business/get-stock.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { stockUuidParamSchema } from "../../dto/requests/stock-uuid.schema";
import { toStockResponse } from "../../dto/responses/stock.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/inventory/stocks/:stockUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getStockController(deps: InventoryDependencies) {
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

    const stock = await getStock(
      { tenantId: header.data["x-tenant-id"], stockUuid: params.data.stockUuid },
      deps,
    );

    sendData(res, 200, toStockResponse(stock));
  });
}
