import { Request, Response } from "express";
import { listCustomers } from "../../../business/list-customers.service";
import { SalesDependencies } from "../../../business/sales.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listCustomersQuerySchema } from "../../dto/requests/list-customers-query.dto";
import { toCustomerResponse } from "../../dto/responses/customer.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated (07_REST_API_STANDARDS.md Ch.14 otherwise mandates
// cursor-based pagination for a list endpoint) — same flagged gap as every
// list endpoint in every other module. This is the controller mounted at
// the module's bare `GET /customers` route — mirroring Authorization's own
// `listRoles`/`listRolesController` tenant-wide-list precedent, with the
// Company-scoped variant (list-customers-by-company.controller.ts) mounted
// at its own static sub-path (`/customers/by-company`).
/** `GET /api/v1/customers` — lists every Customer within the `X-Tenant-Id` tenant, across every Company. */
export function listCustomersController(deps: SalesDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listCustomersQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const customers = await listCustomers({ tenantId: header.data["x-tenant-id"] }, deps);

    sendData(res, 200, customers.map(toCustomerResponse));
  });
}
