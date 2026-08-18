import { Request, Response } from "express";
import { createProductCategory } from "../../../business/create-product-category.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createProductCategoryRequestSchema } from "../../dto/requests/create-product-category.dto";
import { toProductCategoryResponse } from "../../dto/responses/product-category.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/inventory/product-categories` — defines a new Product Category for a Company under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md Ch.35.1). */
export function createProductCategoryController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createProductCategoryRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const productCategory = await createProductCategory(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
        name: body.data.name,
        parentProductCategoryUuid: body.data.parentProductCategoryUuid,
        defaultTaxGroupUuid: body.data.defaultTaxGroupUuid,
      },
      deps,
    );

    sendData(res, 201, toProductCategoryResponse(productCategory));
  });
}
