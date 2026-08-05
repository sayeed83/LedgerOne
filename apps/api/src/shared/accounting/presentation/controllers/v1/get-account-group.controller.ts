import { Request, Response } from "express";
import { getAccountGroup } from "../../../business/get-account-group.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { accountGroupUuidParamSchema } from "../../dto/requests/account-group-uuid.schema";
import { toAccountGroupResponse } from "../../dto/responses/account-group.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/accounting/account-groups/:accountGroupUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getAccountGroupController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = accountGroupUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const accountGroup = await getAccountGroup(
      { tenantId: header.data["x-tenant-id"], accountGroupUuid: params.data.accountGroupUuid },
      deps,
    );

    sendData(res, 200, toAccountGroupResponse(accountGroup));
  });
}
