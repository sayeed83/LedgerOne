import { Request, Response } from "express";
import { getProductCategory } from "../../../business/get-product-category.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { productCategoryUuidParamSchema } from "../../dto/requests/product-category-uuid.schema";
import { toProductCategoryResponse } from "../../dto/responses/product-category.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/inventory/product-categories/:productCategoryUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getProductCategoryController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = productCategoryUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const productCategory = await getProductCategory(
      { tenantId: header.data["x-tenant-id"], productCategoryUuid: params.data.productCategoryUuid },
      deps,
    );

    sendData(res, 200, toProductCategoryResponse(productCategory));
  });
}
