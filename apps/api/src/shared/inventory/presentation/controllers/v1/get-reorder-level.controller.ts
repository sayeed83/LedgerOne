import { Request, Response } from "express";
import { getReorderLevel } from "../../../business/get-reorder-level.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { reorderLevelUuidParamSchema } from "../../dto/requests/reorder-level-uuid.schema";
import { toReorderLevelResponse } from "../../dto/responses/reorder-level.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/inventory/reorder-levels/:reorderLevelUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getReorderLevelController(deps: InventoryDependencies) {
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

    const reorderLevel = await getReorderLevel(
      { tenantId: header.data["x-tenant-id"], reorderLevelUuid: params.data.reorderLevelUuid },
      deps,
    );

    sendData(res, 200, toReorderLevelResponse(reorderLevel));
  });
}
