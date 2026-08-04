// Business layer — lists the Permissions declared by one owning module
// (00_BUSINESS_RULES.md PRM-001 — every Permission belongs to exactly one
// business module/capability). Platform-owned reference data, not
// tenant-scoped (06_DATABASE_STANDARDS.md MT-005).
import { IAuthorizationRepository } from "../domain/interfaces/authorization-repository.interface";
import { Permission } from "../domain/entities/permission.entity";

export interface ListPermissionsByModuleInput {
  moduleName: string;
}

export interface ListPermissionsByModuleDeps {
  repository: IAuthorizationRepository;
}

export async function listPermissionsByModule(
  input: ListPermissionsByModuleInput,
  deps: ListPermissionsByModuleDeps,
): Promise<Permission[]> {
  return deps.repository.listPermissionsByModule(input.moduleName);
}
