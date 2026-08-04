import { Request, Response } from "express";
import { createTaxRule } from "../../../business/create-tax-rule.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { DecimalValue } from "../../../business/accounting-types";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createTaxRuleRequestSchema } from "../../dto/requests/create-tax-rule.dto";
import { toTaxRuleResponse } from "../../dto/responses/tax-rule.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/accounting/tax-rules` — defines a new Tax Rule for a Tax Group under the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md Ch.68.1). */
export function createTaxRuleController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createTaxRuleRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    // `DecimalValue.create` may throw `InvalidDecimalValueError` (a
    // `DomainError`) — caught by `handleDomainErrors` exactly like any error
    // thrown from the Business-layer call below, mirroring
    // create-exchange-rate.controller.ts's identical pattern.
    const taxRule = await createTaxRule(
      {
        tenantId: header.data["x-tenant-id"],
        taxGroupUuid: body.data.taxGroupUuid,
        rate: DecimalValue.create(body.data.rate),
        effectiveFrom: body.data.effectiveFrom,
        effectiveTo: body.data.effectiveTo ?? null,
      },
      deps,
    );

    sendData(res, 201, toTaxRuleResponse(taxRule));
  });
}
