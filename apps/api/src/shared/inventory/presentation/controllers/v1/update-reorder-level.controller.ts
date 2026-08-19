import { Request, Response } from "express";
import { updateReorderLevel } from "../../../business/update-reorder-level.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { reorderLevelUuidParamSchema } from "../../dto/requests/reorder-level-uuid.schema";
import { updateReorderLevelRequestSchema } from "../../dto/requests/update-reorder-level.dto";
import { toReorderLevelResponse } from "../../dto/responses/reorder-level.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/inventory/reorder-levels/:reorderLevelUuid` — revises the Reorder Level's own editable fields (reorderLevel/reorderQuantity). No Warehouse/Product-pair (ROL-101) re-validation, no Stock/reorder-alert integration. */
export function updateReorderLevelController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = reorderLevelUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const body = updateReorderLevelRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const reorderLevel = await updateReorderLevel(
      {
        tenantId: header.data["x-tenant-id"],
        reorderLevelUuid: params.data.reorderLevelUuid,
        reorderLevel: body.data.reorderLevel,
        reorderQuantity: body.data.reorderQuantity,
      },
      deps,
    );

    sendData(res, 200, toReorderLevelResponse(reorderLevel));
  });
}
