import { Request, Response } from "express";
import { updateDepartment } from "../../../business/update-department.service";
import { OrganizationDependencies } from "../../../business/organization.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { departmentUuidParamSchema } from "../../dto/requests/department-uuid.schema";
import { updateDepartmentRequestSchema } from "../../dto/requests/update-department.dto";
import { toDepartmentResponse } from "../../dto/responses/department.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

/** `PUT /api/v1/organization/departments/:departmentUuid` — revises identifying details only; status transitions are not part of this milestone. */
export function updateDepartmentController(deps: OrganizationDependencies) {
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

    const body = updateDepartmentRequestSchema.safeParse(req.body);
    if (!body.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", body.error.issues);
      return;
    }

    const department = await updateDepartment(
      {
        tenantUuid: header.data["x-tenant-id"],
        departmentUuid: params.data.departmentUuid,
        departmentCode: body.data.departmentCode,
        departmentName: body.data.departmentName,
      },
      deps,
    );

    sendData(res, 200, toDepartmentResponse(department));
  });
}
