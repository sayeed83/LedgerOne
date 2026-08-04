// Business layer — lists Users within a Tenant (00_BUSINESS_RULES.md
// USR-001), optionally narrowed to one Company (a cross-module reference,
// FK-002 — trusted as given, per create-user.service.ts's boundary note).
import { IUserManagementRepository } from "../domain/interfaces/user-management-repository.interface";
import { User } from "../domain/aggregates/user.aggregate";

export interface ListUsersInput {
  tenantId: bigint;
  companyUuid?: string;
}

export interface ListUsersDeps {
  repository: IUserManagementRepository;
}

export async function listUsers(input: ListUsersInput, deps: ListUsersDeps): Promise<User[]> {
  const { repository } = deps;

  if (input.companyUuid) {
    return repository.listUsersByCompany(input.tenantId, input.companyUuid);
  }
  return repository.listUsersByTenant(input.tenantId);
}
