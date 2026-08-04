// Business layer — transitions a User to Deactivated (00_BUSINESS_RULES.md
// Ch.10.5): valid only from Active (offboarded). The Domain aggregate's
// `deactivate()` enforces the transition is legal (05_CODING_STANDARDS.md
// Ch.15.4) before this use case persists it.
//
// USR-004 ("an Organization Administrator cannot deactivate the last
// remaining Organization Administrator") is not enforced here — it depends
// on Role assignment, owned by the Authorization module, which this
// module's Business layer has no sanctioned contract to reach
// (03_ARCHITECTURE.md Ch.9.4). Enforcing USR-004 is deferred to whichever
// layer can see both User and Role state once that contract exists.
import { IUserManagementRepository } from "../domain/interfaces/user-management-repository.interface";
import { User } from "../domain/aggregates/user.aggregate";
import { UserNotFoundError } from "../domain/errors/user-management.errors";

export interface DeactivateUserInput {
  tenantId: bigint;
  userUuid: string;
  updatedBy?: bigint | null;
}

export interface DeactivateUserDeps {
  repository: IUserManagementRepository;
}

export async function deactivateUser(input: DeactivateUserInput, deps: DeactivateUserDeps): Promise<User> {
  const { repository } = deps;

  const user = await repository.findUserByUuid(input.tenantId, input.userUuid);
  if (!user) {
    throw new UserNotFoundError(input.userUuid);
  }

  user.deactivate();
  return repository.deactivateUser(input.tenantId, user.uuid, input.updatedBy ?? null);
}
