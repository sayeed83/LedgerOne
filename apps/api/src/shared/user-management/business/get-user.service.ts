// Business layer — reads a User by its external identifier, scoped to the
// supplied Tenant (00_BUSINESS_RULES.md USR-001). Never resolves by the
// internal `id` (06_DATABASE_STANDARDS.md PK-003) — callers outside this
// module only ever hold the `uuid`.
import { IUserManagementRepository } from "../domain/interfaces/user-management-repository.interface";
import { User } from "../domain/aggregates/user.aggregate";
import { UserNotFoundError } from "../domain/errors/user-management.errors";

export interface GetUserInput {
  tenantId: bigint;
  userUuid: string;
}

export interface GetUserDeps {
  repository: IUserManagementRepository;
}

export async function getUser(input: GetUserInput, deps: GetUserDeps): Promise<User> {
  const user = await deps.repository.findUserByUuid(input.tenantId, input.userUuid);
  if (!user) {
    throw new UserNotFoundError(input.userUuid);
  }
  return user;
}
