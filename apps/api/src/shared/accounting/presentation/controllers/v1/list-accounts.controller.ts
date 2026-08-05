import { Request, Response } from "express";
import { listAccounts } from "../../../business/list-accounts.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listAccountsQuerySchema } from "../../dto/requests/list-accounts-query.dto";
import { toAccountResponse } from "../../dto/responses/account.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every other list endpoint in this module.
/** `GET /api/v1/accounting/accounts` — lists Accounts within the `X-Tenant-Id` tenant, optionally narrowed by `?companyUuid=`/`?accountGroupUuid=`/`?status=`. */
export function listAccountsController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listAccountsQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const accounts = await listAccounts(
      {
        tenantId: header.data["x-tenant-id"],
        companyUuid: query.data.companyUuid,
        accountGroupUuid: query.data.accountGroupUuid,
        status: query.data.status,
      },
      deps,
    );

    sendData(res, 200, accounts.map(toAccountResponse));
  });
}
