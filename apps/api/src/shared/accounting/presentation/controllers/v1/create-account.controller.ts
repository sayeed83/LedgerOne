import { Request, Response } from "express";
import { createAccount } from "../../../business/create-account.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createAccountRequestSchema } from "../../dto/requests/create-account.dto";
import { toAccountResponse } from "../../dto/responses/account.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/accounting/accounts` — defines a new Account within a Company's Chart of Accounts under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md Ch.17.1). */
export function createAccountController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createAccountRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const account = await createAccount(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
        code: body.data.code,
        name: body.data.name,
        accountType: body.data.accountType,
        accountGroupUuid: body.data.accountGroupUuid,
        parentAccountUuid: body.data.parentAccountUuid,
        isPostingAccount: body.data.isPostingAccount,
      },
      deps,
    );

    sendData(res, 201, toAccountResponse(account));
  });
}
