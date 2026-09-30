import { Request, Response } from "express";
import { listCustomersByCompany } from "../../../business/list-customers-by-company.service";
import { SalesDependencies } from "../../../business/sales.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listCustomersByCompanyQuerySchema } from "../../dto/requests/list-customers-by-company-query.dto";
import { toCustomerResponse } from "../../dto/responses/customer.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every list endpoint in this module.
// Mounted at its own static sub-path (`/customers/by-company`), registered
// before `/customers/:customerUuid` so Express never matches this literal
// segment as the `:customerUuid` param — mirroring Inventory's own
// `/reorder-levels/by-warehouse`-before-`/reorder-levels/:reorderLevelUuid`
// precedent exactly.
/** `GET /api/v1/customers/by-company?companyUuid=` — lists every Customer belonging to a single Company, under the `X-Tenant-Id` tenant. `companyUuid` is required, not optional (mirrors the Business layer's own `listCustomersByCompany` shape). */
export function listCustomersByCompanyController(deps: SalesDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listCustomersByCompanyQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const customers = await listCustomersByCompany(
      { tenantId: header.data["x-tenant-id"], companyUuid: query.data.companyUuid },
      deps,
    );

    sendData(res, 200, customers.map(toCustomerResponse));
  });
}
