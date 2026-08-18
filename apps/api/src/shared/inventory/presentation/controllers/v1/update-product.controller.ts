import { Request, Response } from "express";
import { updateProduct } from "../../../business/update-product.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { productUuidParamSchema } from "../../dto/requests/product-uuid.schema";
import { updateProductRequestSchema } from "../../dto/requests/update-product.dto";
import { toProductResponse } from "../../dto/responses/product.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/inventory/products/:productUuid` — revises the Product's code/name/description/Product Category/Unit/Stocked flag/status (00_BUSINESS_RULES.md Ch.34.5). */
export function updateProductController(deps: InventoryDependencies) {
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

    const body = updateProductRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const product = await updateProduct(
      {
        tenantId: header.data["x-tenant-id"],
        productUuid: params.data.productUuid,
        productCode: body.data.productCode,
        name: body.data.name,
        description: body.data.description,
        productCategoryUuid: body.data.productCategoryUuid,
        unitUuid: body.data.unitUuid,
        isStocked: body.data.isStocked,
        status: body.data.status,
      },
      deps,
    );

    sendData(res, 200, toProductResponse(product));
  });
}
