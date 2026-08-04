// Business layer — transitions a User to Suspended (00_BUSINESS_RULES.md
// Ch.10.5): valid only from Active (e.g., leave of absence). The Domain
// aggregate's `suspend()` enforces the transition is legal
// (05_CODING_STANDARDS.md Ch.15.4) before this use case persists it.
import { IUserManagementRepository } from "../domain/interfaces/user-management-repository.interface";
import { User } from "../domain/aggregates/user.aggregate";
import { UserNotFoundError } from "../domain/errors/user-management.errors";

export interface SuspendUserInput {
  tenantId: bigint;
  userUuid: string;
  updatedBy?: bigint | null;
}

export interface SuspendUserDeps {
  repository: IUserManagementRepository;
}

export async function suspendUser(input: SuspendUserInput, deps: SuspendUserDeps): Promise<User> {
  const { repository } = deps;

  const user = await repository.findUserByUuid(input.tenantId, input.userUuid);
  if (!user) {
    throw new UserNotFoundError(input.userUuid);
  }

  user.suspend();
  return repository.suspendUser(input.tenantId, user.uuid, input.updatedBy ?? null);
}
