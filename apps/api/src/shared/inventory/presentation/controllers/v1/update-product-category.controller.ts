import { Request, Response } from "express";
import { updateProductCategory } from "../../../business/update-product-category.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { productCategoryUuidParamSchema } from "../../dto/requests/product-category-uuid.schema";
import { updateProductCategoryRequestSchema } from "../../dto/requests/update-product-category.dto";
import { toProductCategoryResponse } from "../../dto/responses/product-category.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/inventory/product-categories/:productCategoryUuid` — revises the Product Category's name/parent/default Tax Group (00_BUSINESS_RULES.md Ch.35.5). */
export function updateProductCategoryController(deps: InventoryDependencies) {
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

    const body = updateProductCategoryRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const productCategory = await updateProductCategory(
      {
        tenantId: header.data["x-tenant-id"],
        productCategoryUuid: params.data.productCategoryUuid,
        name: body.data.name,
        parentProductCategoryUuid: body.data.parentProductCategoryUuid,
        defaultTaxGroupUuid: body.data.defaultTaxGroupUuid,
      },
      deps,
    );

    sendData(res, 200, toProductCategoryResponse(productCategory));
  });
}
