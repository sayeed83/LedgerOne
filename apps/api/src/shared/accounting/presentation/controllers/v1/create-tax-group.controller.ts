import { Request, Response } from "express";
import { createTaxGroup } from "../../../business/create-tax-group.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createTaxGroupRequestSchema } from "../../dto/requests/create-tax-group.dto";
import { toTaxGroupResponse } from "../../dto/responses/tax-group.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/accounting/tax-groups` — defines a new Tax Group for a Company under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md Ch.67.1). */
export function createTaxGroupController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createTaxGroupRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const taxGroup = await createTaxGroup(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
        name: body.data.name,
      },
      deps,
    );

    sendData(res, 201, toTaxGroupResponse(taxGroup));
  });
}
