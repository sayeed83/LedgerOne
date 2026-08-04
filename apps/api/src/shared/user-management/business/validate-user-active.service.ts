// Business layer — the guard other use cases call before allowing a
// User-scoped operation to proceed, mirroring Organization's
// ValidateTenantIsActive. Only an Active User is presumed able to transact
// (00_BUSINESS_RULES.md USR-002 — role assignment is a further, separate
// Authorization-module condition not checked here). Read-only.
import { IUserManagementRepository } from "../domain/interfaces/user-management-repository.interface";
import { User } from "../domain/aggregates/user.aggregate";
import { UserStatus } from "../domain/enums/user-status.enum";
import { UserNotFoundError, UserNotActiveError } from "../domain/errors/user-management.errors";

export interface ValidateUserActiveInput {
  tenantId: bigint;
  userUuid: string;
}

export interface ValidateUserActiveDeps {
  repository: IUserManagementRepository;
}

export async function validateUserActive(input: ValidateUserActiveInput, deps: ValidateUserActiveDeps): Promise<User> {
  const user = await deps.repository.findUserByUuid(input.tenantId, input.userUuid);
  if (!user) {
    throw new UserNotFoundError(input.userUuid);
  }

  if (user.status !== UserStatus.Active) {
    throw new UserNotActiveError(user.uuid, user.status);
  }

  return user;
}
