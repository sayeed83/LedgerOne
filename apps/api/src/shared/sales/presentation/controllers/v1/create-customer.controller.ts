import { Request, Response } from "express";
import { createCustomer } from "../../../business/create-customer.service";
import { SalesDependencies } from "../../../business/sales.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createCustomerRequestSchema } from "../../dto/requests/create-customer.dto";
import { toCustomerResponse } from "../../dto/responses/customer.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/customers` — defines a new Customer for a Company (00_BUSINESS_RULES.md Ch.45) under the `X-Tenant-Id` tenant. */
export function createCustomerController(deps: SalesDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createCustomerRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const customer = await createCustomer(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
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

    sendData(res, 201, toCustomerResponse(customer));
  });
}
