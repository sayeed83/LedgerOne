import { Request, Response } from "express";
import { createProduct } from "../../../business/create-product.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createProductRequestSchema } from "../../dto/requests/create-product.dto";
import { toProductResponse } from "../../dto/responses/product.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/inventory/products` — defines a new Product for a Company under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md Ch.34.1). */
export function createProductController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createProductRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const product = await createProduct(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
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

    sendData(res, 201, toProductResponse(product));
  });
}
