import { Request, Response } from "express";
import { listAccountGroups } from "../../../business/list-account-groups.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listAccountGroupsQuerySchema } from "../../dto/requests/list-account-groups-query.dto";
import { toAccountGroupResponse } from "../../dto/responses/account-group.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every other list endpoint in this module.
/** `GET /api/v1/accounting/account-groups` — lists Account Groups within the `X-Tenant-Id` tenant, optionally narrowed by `?companyUuid=`. */
export function listAccountGroupsController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listAccountGroupsQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const accountGroups = await listAccountGroups(
      { tenantId: header.data["x-tenant-id"], companyUuid: query.data.companyUuid },
      deps,
    );

    sendData(res, 200, accountGroups.map(toAccountGroupResponse));
  });
}
