import { Request, Response } from "express";
import { createBatch } from "../../../business/create-batch.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createBatchRequestSchema } from "../../dto/requests/create-batch.dto";
import { toBatchResponse } from "../../dto/responses/batch.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/inventory/batches` — records a new Batch/Lot (00_BUSINESS_RULES.md Ch.40) under the `X-Tenant-Id` tenant. */
export function createBatchController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createBatchRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const batch = await createBatch(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
        productId: body.data.productId,
        warehouseUuid: body.data.warehouseUuid,
        batchNumber: body.data.batchNumber,
        manufactureDate: body.data.manufactureDate,
        expiryDate: body.data.expiryDate,
        quantity: body.data.quantity,
        status: body.data.status,
      },
      deps,
    );

    sendData(res, 201, toBatchResponse(batch));
  });
}
