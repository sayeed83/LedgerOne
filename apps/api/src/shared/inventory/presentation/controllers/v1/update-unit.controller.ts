import { Request, Response } from "express";
import { updateUnit } from "../../../business/update-unit.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { unitUuidParamSchema } from "../../dto/requests/unit-uuid.schema";
import { updateUnitRequestSchema } from "../../dto/requests/update-unit.dto";
import { toUnitResponse } from "../../dto/responses/unit.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/inventory/units/:unitUuid` — revises the Unit's name/symbol/base Unit/conversion factor (00_BUSINESS_RULES.md Ch.36.5). */
export function updateUnitController(deps: InventoryDependencies) {
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

    const body = updateUnitRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const unit = await updateUnit(
      {
        tenantId: header.data["x-tenant-id"],
        unitUuid: params.data.unitUuid,
        name: body.data.name,
        symbol: body.data.symbol,
        baseUnitUuid: body.data.baseUnitUuid,
        conversionFactor: body.data.conversionFactor,
      },
      deps,
    );

    sendData(res, 200, toUnitResponse(unit));
  });
}
