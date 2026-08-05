import { Request, Response } from "express";
import { deactivateAccount } from "../../../business/deactivate-account.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { accountUuidParamSchema } from "../../dto/requests/account-uuid.schema";
import { toAccountResponse } from "../../dto/responses/account.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// `X-Tenant-Id` header required — unlike Currency, Account is tenant-owned
// (06_DATABASE_STANDARDS.md MT-001, mirroring Tax Group's own ownership
// shape).
/** `POST /api/v1/accounting/accounts/:accountUuid/deactivate` — 00_BUSINESS_RULES.md Ch.17.5: Active -> Inactive. */
export function deactivateAccountController(deps: AccountingDependencies) {
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

    const account = await deactivateAccount(
      { tenantId: header.data["x-tenant-id"], accountUuid: params.data.accountUuid },
      deps,
    );

    sendData(res, 200, toAccountResponse(account));
  });
}
