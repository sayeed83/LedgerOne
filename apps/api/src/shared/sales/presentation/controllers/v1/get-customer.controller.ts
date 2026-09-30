import { Request, Response } from "express";
import { getCustomer } from "../../../business/get-customer.service";
import { SalesDependencies } from "../../../business/sales.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { customerUuidParamSchema } from "../../dto/requests/customer-uuid.schema";
import { toCustomerResponse } from "../../dto/responses/customer.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/customers/:customerUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getCustomerController(deps: SalesDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = customerUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const customer = await getCustomer(
      { tenantId: header.data["x-tenant-id"], customerUuid: params.data.customerUuid },
      deps,
    );

    sendData(res, 200, toCustomerResponse(customer));
  });
}
