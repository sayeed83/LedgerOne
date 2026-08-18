import { Request, Response } from "express";
import { listProductCategories } from "../../../business/list-product-categories.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listProductCategoriesQuerySchema } from "../../dto/requests/list-product-categories-query.dto";
import { toProductCategoryResponse } from "../../dto/responses/product-category.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every list endpoint in Accounting's own module.
/** `GET /api/v1/inventory/product-categories` — lists Product Categories within the `X-Tenant-Id` tenant, optionally narrowed by `?companyUuid=`. */
export function listProductCategoriesController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listProductCategoriesQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const productCategories = await listProductCategories(
      { tenantId: header.data["x-tenant-id"], companyUuid: query.data.companyUuid },
      deps,
    );

    sendData(res, 200, productCategories.map(toProductCategoryResponse));
  });
}
