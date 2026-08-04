import { Request, Response } from "express";
import { updateTaxGroup } from "../../../business/update-tax-group.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { taxGroupUuidParamSchema } from "../../dto/requests/tax-group-uuid.schema";
import { updateTaxGroupRequestSchema } from "../../dto/requests/update-tax-group.dto";
import { toTaxGroupResponse } from "../../dto/responses/tax-group.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/accounting/tax-groups/:taxGroupUuid` — revises the Tax Group's name only (00_BUSINESS_RULES.md Ch.67.5). */
export function updateTaxGroupController(deps: AccountingDependencies) {
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

    const body = updateTaxGroupRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const taxGroup = await updateTaxGroup(
      {
        tenantId: header.data["x-tenant-id"],
        taxGroupUuid: params.data.taxGroupUuid,
        name: body.data.name,
      },
      deps,
    );

    sendData(res, 200, toTaxGroupResponse(taxGroup));
  });
}
