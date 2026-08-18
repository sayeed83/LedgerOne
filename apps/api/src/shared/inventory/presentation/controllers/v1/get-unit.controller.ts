import { Request, Response } from "express";
import { getUnit } from "../../../business/get-unit.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { unitUuidParamSchema } from "../../dto/requests/unit-uuid.schema";
import { toUnitResponse } from "../../dto/responses/unit.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/inventory/units/:unitUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getUnitController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = unitUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const unit = await getUnit({ tenantId: header.data["x-tenant-id"], unitUuid: params.data.unitUuid }, deps);

    sendData(res, 200, toUnitResponse(unit));
  });
}
