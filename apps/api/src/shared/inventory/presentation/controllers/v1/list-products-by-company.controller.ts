import { Request, Response } from "express";
import { listProductsByCompany } from "../../../business/list-products-by-company.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listProductsByCompanyQuerySchema } from "../../dto/requests/list-products-by-company-query.dto";
import { toProductResponse } from "../../dto/responses/product.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every list endpoint in this module.
/** `GET /api/v1/inventory/products?companyUuid=` — lists every Product belonging to a single Company under the `X-Tenant-Id` tenant. `companyUuid` is required, not optional (mirrors the Business layer's own `listProductsByCompany` shape). */
export function listProductsByCompanyController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listProductsByCompanyQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const products = await listProductsByCompany(
      { tenantId: header.data["x-tenant-id"], companyUuid: query.data.companyUuid },
      deps,
    );

    sendData(res, 200, products.map(toProductResponse));
  });
}
