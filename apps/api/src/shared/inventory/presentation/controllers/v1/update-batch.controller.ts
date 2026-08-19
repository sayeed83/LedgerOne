import { Request, Response } from "express";
import { updateBatch } from "../../../business/update-batch.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { batchUuidParamSchema } from "../../dto/requests/batch-uuid.schema";
import { updateBatchRequestSchema } from "../../dto/requests/update-batch.dto";
import { toBatchResponse } from "../../dto/responses/batch.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/inventory/batches/:batchUuid` — revises the Batch's own editable fields (batchNumber/manufactureDate/expiryDate/quantity/status). No BAT-001/BAT-002/BAT-003 enforcement, no Product/Stock Movement integration. */
export function updateBatchController(deps: InventoryDependencies) {
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

    const body = updateBatchRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const batch = await updateBatch(
      {
        tenantId: header.data["x-tenant-id"],
        batchUuid: params.data.batchUuid,
        batchNumber: body.data.batchNumber,
        manufactureDate: body.data.manufactureDate,
        expiryDate: body.data.expiryDate,
        quantity: body.data.quantity,
        status: body.data.status,
      },
      deps,
    );

    sendData(res, 200, toBatchResponse(batch));
  });
}
