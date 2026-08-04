import { Request, Response } from "express";
import { listTaxRules } from "../../../business/list-tax-rules.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listTaxRulesQuerySchema } from "../../dto/requests/list-tax-rules-query.dto";
import { toTaxRuleResponse } from "../../dto/responses/tax-rule.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every other list endpoint in this module.
/** `GET /api/v1/accounting/tax-rules` — lists Tax Rules within the `X-Tenant-Id` tenant, optionally narrowed by `?taxGroupUuid=`. */
export function listTaxRulesController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listTaxRulesQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const taxRules = await listTaxRules(
      { tenantId: header.data["x-tenant-id"], taxGroupUuid: query.data.taxGroupUuid },
      deps,
    );

    sendData(res, 200, taxRules.map(toTaxRuleResponse));
  });
}
