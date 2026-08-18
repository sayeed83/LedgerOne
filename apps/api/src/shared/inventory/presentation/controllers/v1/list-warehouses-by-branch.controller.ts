import { Request, Response } from "express";
import { listWarehousesByBranch } from "../../../business/list-warehouses-by-branch.service";
import { InventoryDependencies } from "../../../business/inventory.composition";
import { tenantIdHeaderSchema } from "../../dto/requests/tenant-id-header.schema";
import { listWarehousesByBranchQuerySchema } from "../../dto/requests/list-warehouses-by-branch-query.dto";
import { toWarehouseResponse } from "../../dto/responses/warehouse.response.dto";
import { handleDomainErrors } from "../../support/handle-domain-errors";
import { sendData, sendError } from "../../support/response-envelope";

// Unpaginated, same flagged gap as every list endpoint in this module.
/** `GET /api/v1/inventory/warehouses?branchUuid=` — lists every Warehouse belonging to a single Branch under the `X-Tenant-Id` tenant. `branchUuid` is required, not optional (mirrors the Business layer's own `listWarehousesByBranch` shape). */
export function listWarehousesByBranchController(deps: InventoryDependencies) {
  return handleDomainErrors(async (req: Request, res: Response): Promise<void> => {
    const header = tenantIdHeaderSchema.safeParse(req.headers);
    if (!header.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", header.error.issues);
      return;
    }

    const query = listWarehousesByBranchQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendError(res, 422, "VALIDATION_ERROR", "Request validation failed.", query.error.issues);
      return;
    }

    const warehouses = await listWarehousesByBranch(
      { tenantId: header.data["x-tenant-id"], branchUuid: query.data.branchUuid },
      deps,
    );

    sendData(res, 200, warehouses.map(toWarehouseResponse));
  });
}
