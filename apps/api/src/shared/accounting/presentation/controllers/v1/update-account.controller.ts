import { Request, Response } from "express";
import { updateAccount } from "../../../business/update-account.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { accountUuidParamSchema } from "../../dto/requests/account-uuid.schema";
import { updateAccountRequestSchema } from "../../dto/requests/update-account.dto";
import { toAccountResponse } from "../../dto/responses/account.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/accounting/accounts/:accountUuid` — revises the Account's name/Account Group/parent/posting flag; `code`/`accountType` are never revisable (COA-004/COA-001). */
export function updateAccountController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = accountUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const body = updateAccountRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const account = await updateAccount(
      {
        tenantId: header.data["x-tenant-id"],
        accountUuid: params.data.accountUuid,
        name: body.data.name,
        accountGroupUuid: body.data.accountGroupUuid,
        parentAccountUuid: body.data.parentAccountUuid,
        isPostingAccount: body.data.isPostingAccount,
      },
      deps,
    );

    sendData(res, 200, toAccountResponse(account));
  });
}
