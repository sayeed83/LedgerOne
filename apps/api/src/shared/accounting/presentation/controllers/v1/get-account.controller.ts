import { Request, Response } from "express";
import { getAccount } from "../../../business/get-account.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { accountUuidParamSchema } from "../../dto/requests/account-uuid.schema";
import { toAccountResponse } from "../../dto/responses/account.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/accounting/accounts/:accountUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getAccountController(deps: AccountingDependencies) {
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

    const account = await getAccount(
      { tenantId: header.data["x-tenant-id"], accountUuid: params.data.accountUuid },
      deps,
    );

    sendData(res, 200, toAccountResponse(account));
  });
}
