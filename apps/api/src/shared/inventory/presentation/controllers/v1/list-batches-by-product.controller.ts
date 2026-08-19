import { Request, Response } from "express";
import { listBatchesByProduct } from "../../../business/list-batches-by-product.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listBatchesByProductQuerySchema } from "../../dto/requests/list-batches-by-product-query.dto";
import { toBatchResponse } from "../../dto/responses/batch.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every list endpoint in this module.
// **Not mounted to a route this milestone.** This milestone's own
// instruction registers exactly 4 Batch routes (`POST /batches`,
// `GET /batches`, `GET /batches/:batchUuid`, `PUT /batches/:batchUuid`) —
// a single bare list route, filled by
// list-batches-by-warehouse.controller.ts (see that file's own header
// comment), mirroring Inventory Adjustment's/Stock Movement's own
// precedent of exposing only one list variant at the bare list route even
// when the Business layer supports more than one. This controller exists,
// fully implemented against the already-shipped `listBatchesByProduct`
// Business service, ready for a future milestone to route if a
// Product-scoped Batch listing endpoint is ever authorized — not silently
// invented as an additional, unauthorized route in this one.
/** `GET /api/v1/inventory/batches?productId=` (not yet routed — see header comment) — would list every Batch belonging to a single Product under the `X-Tenant-Id` tenant. */
export function listBatchesByProductController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listBatchesByProductQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const batches = await listBatchesByProduct(
      { tenantId: header.data["x-tenant-id"], productId: query.data.productId },
      deps,
    );

    sendData(res, 200, batches.map(toBatchResponse));
  });
}
