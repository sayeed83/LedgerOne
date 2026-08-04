import { Request, Response } from "express";
import { getTaxGroup } from "../../../business/get-tax-group.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { taxGroupUuidParamSchema } from "../../dto/requests/tax-group-uuid.schema";
import { toTaxGroupResponse } from "../../dto/responses/tax-group.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/accounting/tax-groups/:taxGroupUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getTaxGroupController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = taxGroupUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const taxGroup = await getTaxGroup(
      { tenantId: header.data["x-tenant-id"], taxGroupUuid: params.data.taxGroupUuid },
      deps,
    );

    sendData(res, 200, toTaxGroupResponse(taxGroup));
  });
}
