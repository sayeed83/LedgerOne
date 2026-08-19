// Mirrors apps/api/src/shared/authorization/domain/enums/permission-action.enum.ts.
export enum PermissionAction {
  View = "VIEW",
  Create = "CREATE",
  Edit = "EDIT",
  Approve = "APPROVE",
  Delete = "DELETE",
}

// Mirrors presentation/dto/responses/permission.response.dto.ts. Permission
// is platform-owned, read-only reference data (MT-005/PRM-001) — no create/
// update/delete endpoint exists for it anywhere in the backend.
export interface PermissionResponseDto {
  uuid: string;
  permissionKey: string;
  moduleName: string;
  resource: string;
  action: PermissionAction;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
