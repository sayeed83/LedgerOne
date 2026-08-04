import { Request, Response } from "express";
import { getDepartment } from "../../../business/get-department.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { departmentUuidParamSchema } from "../../dto/requests/department-uuid.schema";
import { toDepartmentResponse } from "../../dto/responses/department.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `GET /api/v1/organization/departments/:departmentUuid` — scoped to the `X-Tenant-Id` tenant. */
export function getDepartmentController(deps: OrganizationDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const params = departmentUuidParamSchema.safeParse(req.params);
    if (!params.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", params.error.issues);
      return;
    }

    const department = await getDepartment(
      { tenantUuid: header.data["x-tenant-id"], departmentUuid: params.data.departmentUuid },
      deps,
    );

    sendData(res, 200, toDepartmentResponse(department));
  });
}
