import { Request, Response } from "express";
import { updateAccountGroup } from "../../../business/update-account-group.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { accountGroupUuidParamSchema } from "../../dto/requests/account-group-uuid.schema";
import { updateAccountGroupRequestSchema } from "../../dto/requests/update-account-group.dto";
import { toAccountGroupResponse } from "../../dto/responses/account-group.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/accounting/account-groups/:accountGroupUuid` — revises the Account Group's name/accountType/parent (00_BUSINESS_RULES.md Ch.18.5). */
export function updateAccountGroupController(deps: AccountingDependencies) {
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

    const body = updateAccountGroupRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const accountGroup = await updateAccountGroup(
      {
        tenantId: header.data["x-tenant-id"],
        accountGroupUuid: params.data.accountGroupUuid,
        name: body.data.name,
        accountType: body.data.accountType,
        parentAccountGroupUuid: body.data.parentAccountGroupUuid,
      },
      deps,
    );

    sendData(res, 200, toAccountGroupResponse(accountGroup));
  });
}
