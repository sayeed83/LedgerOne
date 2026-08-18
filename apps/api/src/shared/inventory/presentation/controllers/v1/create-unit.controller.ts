import { Request, Response } from "express";
import { createUnit } from "../../../business/create-unit.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createUnitRequestSchema } from "../../dto/requests/create-unit.dto";
import { toUnitResponse } from "../../dto/responses/unit.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/inventory/units` — defines a new Unit of Measure for a Company under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md Ch.36.1). */
export function createUnitController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createUnitRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const unit = await createUnit(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
        name: body.data.name,
        symbol: body.data.symbol,
        baseUnitUuid: body.data.baseUnitUuid,
        conversionFactor: body.data.conversionFactor,
      },
      deps,
    );

    sendData(res, 201, toUnitResponse(unit));
  });
}
