import { Request, Response } from "express";
import { listTaxGroups } from "../../../business/list-tax-groups.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listTaxGroupsQuerySchema } from "../../dto/requests/list-tax-groups-query.dto";
import { toTaxGroupResponse } from "../../dto/responses/tax-group.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every other list endpoint in this module.
/** `GET /api/v1/accounting/tax-groups` — lists Tax Groups within the `X-Tenant-Id` tenant, optionally narrowed by `?companyUuid=`. */
export function listTaxGroupsController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listTaxGroupsQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const taxGroups = await listTaxGroups(
      { tenantId: header.data["x-tenant-id"], companyUuid: query.data.companyUuid },
      deps,
    );

    sendData(res, 200, taxGroups.map(toTaxGroupResponse));
  });
}
