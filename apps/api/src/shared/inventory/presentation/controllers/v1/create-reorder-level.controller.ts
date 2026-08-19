import { Request, Response } from "express";
import { createReorderLevel } from "../../../business/create-reorder-level.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createReorderLevelRequestSchema } from "../../dto/requests/create-reorder-level.dto";
import { toReorderLevelResponse } from "../../dto/responses/reorder-level.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/inventory/reorder-levels` — defines a new Reorder Level for a Product in a Warehouse (00_BUSINESS_RULES.md Ch.42) under the `X-Tenant-Id` tenant. */
export function createReorderLevelController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createReorderLevelRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const reorderLevel = await createReorderLevel(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
        warehouseUuid: body.data.warehouseUuid,
        productId: body.data.productId,
        reorderLevel: body.data.reorderLevel,
        reorderQuantity: body.data.reorderQuantity,
      },
      deps,
    );

    sendData(res, 201, toReorderLevelResponse(reorderLevel));
  });
}
