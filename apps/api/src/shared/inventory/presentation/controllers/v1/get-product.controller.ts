import { Request, Response } from "express";
import { getProduct } from "../../../business/get-product.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { productUuidParamSchema } from "../../dto/requests/product-uuid.schema";
import { toProductResponse } from "../../dto/responses/product.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/inventory/products/:productUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getProductController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = productUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const product = await getProduct(
      { tenantId: header.data["x-tenant-id"], productUuid: params.data.productUuid },
      deps,
    );

    sendData(res, 200, toProductResponse(product));
  });
}
