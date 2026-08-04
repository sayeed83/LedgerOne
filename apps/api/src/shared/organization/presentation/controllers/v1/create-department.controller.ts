import { Request, Response } from "express";
import { createDepartment } from "../../../business/create-department.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { createDepartmentRequestSchema } from "../../dto/requests/create-department.dto";
import { toDepartmentResponse } from "../../dto/responses/department.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `POST /api/v1/organization/departments` — registers a new Department under the Company named in the body, scoped to the `X-Tenant-Id` tenant (00_BUSINESS_RULES.md DPT-001). */
export function createDepartmentController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const body = createDepartmentRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const department = await createDepartment(
      {
        tenantUuid: header.data["x-tenant-id"],
        companyUuid: body.data.companyUuid,
        departmentCode: body.data.departmentCode,
        departmentName: body.data.departmentName,
      },
      deps,
    );

    sendData(res, 201, toDepartmentResponse(department));
  });
}
