import { Request, Response } from "express";
import { updateCustomer } from "../../../business/update-customer.service";
import { SalesDependencies } from "../../../business/sales.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { customerUuidParamSchema } from "../../dto/requests/customer-uuid.schema";
import { updateCustomerRequestSchema } from "../../dto/requests/update-customer.dto";
import { toCustomerResponse } from "../../dto/responses/customer.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/customers/:customerUuid` — revises the Customer's own editable fields (name/address/credit limit/payment terms/status). No status-transition validation, no CUS-002 threshold check. */
export function updateCustomerController(deps: SalesDependencies) {
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

    const body = updateCustomerRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const customer = await updateCustomer(
      {
        tenantId: header.data["x-tenant-id"],
        customerUuid: params.data.customerUuid,
        name: body.data.name,
        addressLine1: body.data.addressLine1,
        addressLine2: body.data.addressLine2,
        city: body.data.city,
        region: body.data.region,
        postalCode: body.data.postalCode,
        countryCode: body.data.countryCode,
        creditLimit: body.data.creditLimit,
        paymentTerms: body.data.paymentTerms,
        status: body.data.status,
      },
      deps,
    );

    sendData(res, 200, toCustomerResponse(customer));
  });
}
