import { Request, Response } from "express";
import { listFinancialYears } from "../../../business/list-financial-years.service";
import { AccountingDependencies } from "../../../business/accounting.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listFinancialYearsQuerySchema } from "../../dto/requests/list-financial-years-query.dto";
import { toFinancialYearResponse } from "../../dto/responses/financial-year.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated (07_REST_API_STANDARDS.md Ch.14 otherwise mandates
// cursor-based pagination for a list endpoint) — same flagged gap as
// Authorization's list-roles.controller.ts/User Management's
// list-users.controller.ts: the approved Repository layer
// (`IAccountingRepository.listFinancialYears`) exposes no cursor/limit
// parameter to build real pagination on top of.
/** `GET /api/v1/accounting/financial-years` — lists Financial Years within the `X-Tenant-Id` tenant, optionally narrowed by `?companyUuid=`. */
export function listFinancialYearsController(deps: AccountingDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listFinancialYearsQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const financialYears = await listFinancialYears(
      { tenantId: header.data["x-tenant-id"], companyUuid: query.data.companyUuid },
      deps,
    );

    sendData(res, 200, financialYears.map(toFinancialYearResponse));
  });
}
