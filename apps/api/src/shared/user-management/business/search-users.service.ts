// Business layer — free-text lookup of Users within a Tenant, by name or
// email (00_BUSINESS_RULES.md Ch.10 owns no dedicated "search" rule; this is
// the query-shaping use case around the Repository's substring match).
import { IUserManagementRepository } from "../domain/interfaces/user-management-repository.interface";
import { User } from "../domain/aggregates/user.aggregate";

export interface SearchUsersInput {
  tenantId: bigint;
  query: string;
}

export interface SearchUsersDeps {
  repository: IUserManagementRepository;
}

export async function searchUsers(input: SearchUsersInput, deps: SearchUsersDeps): Promise<User[]> {
  return deps.repository.searchUsers(input.tenantId, input.query.trim());
}
