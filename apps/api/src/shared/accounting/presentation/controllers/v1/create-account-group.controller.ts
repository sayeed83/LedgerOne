import { Request, Response } from "express";
import { createAccountGroup } from "../../../business/create-account-group.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createAccountGroupRequestSchema } from "../../dto/requests/create-account-group.dto";
import { toAccountGroupResponse } from "../../dto/responses/account-group.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/accounting/account-groups` — defines a new Account Group for a Company under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md Ch.18.1). */
export function createAccountGroupController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createAccountGroupRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const accountGroup = await createAccountGroup(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
        name: body.data.name,
        accountType: body.data.accountType,
        parentAccountGroupUuid: body.data.parentAccountGroupUuid,
      },
      deps,
    );

    sendData(res, 201, toAccountGroupResponse(accountGroup));
  });
}
