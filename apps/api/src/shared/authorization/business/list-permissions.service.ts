// Business layer — lists every platform-defined Permission
// (00_BUSINESS_RULES.md Ch.12.5 — permissions are platform-defined, not
// tenant-scoped). No input: Permission is platform-owned reference data
// (06_DATABASE_STANDARDS.md MT-005), not filtered by Tenant.
import { IAuthorizationRepository } from "../domain/interfaces/authorization-repository.interface";
import { Permission } from "../domain/entities/permission.entity";

export interface ListPermissionsDeps {
  repository: IAuthorizationRepository;
}

export async function listPermissions(deps: ListPermissionsDeps): Promise<Permission[]> {
  return deps.repository.listPermissions();
}
