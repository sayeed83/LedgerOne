import { Request, Response } from "express";
import { getBatch } from "../../../business/get-batch.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { batchUuidParamSchema } from "../../dto/requests/batch-uuid.schema";
import { toBatchResponse } from "../../dto/responses/batch.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/inventory/batches/:batchUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getBatchController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = batchUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const batch = await getBatch(
      { tenantId: header.data["x-tenant-id"], batchUuid: params.data.batchUuid },
      deps,
    );

    sendData(res, 200, toBatchResponse(batch));
  });
}
