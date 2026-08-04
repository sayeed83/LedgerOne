import { Request, Response } from "express";
import { getTaxRule } from "../../../business/get-tax-rule.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { taxRuleUuidParamSchema } from "../../dto/requests/tax-rule-uuid.schema";
import { toTaxRuleResponse } from "../../dto/responses/tax-rule.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/accounting/tax-rules/:taxRuleUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getTaxRuleController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = taxRuleUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const taxRule = await getTaxRule(
      { tenantId: header.data["x-tenant-id"], taxRuleUuid: params.data.taxRuleUuid },
      deps,
    );

    sendData(res, 200, toTaxRuleResponse(taxRule));
  });
}
