// Business layer — revises a User's identifying/contact details and
// organizational assignment. Status is never changed here (see
// activate/suspend/deactivate-user.service.ts). If `email` is being
// changed, the new email must still be unique within the Tenant
// (00_BUSINESS_RULES.md Ch.10.8 — mirrors create-user.service.ts's check).
import { IUserManagementRepository } from "../domain/interfaces/user-management-repository.interface";
import { User } from "../domain/aggregates/user.aggregate";
import { UserNotFoundError, DuplicateUserEmailError } from "../domain/errors/user-management.errors";

export interface UpdateUserInput {
  tenantId: bigint;
  userUuid: string;
  companyUuid?: string;
  branchUuid?: string | null;
  departmentUuid?: string | null;
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  displayName?: string | null;
  email?: string;
  mobileNumber?: string | null;
  updatedBy?: bigint | null;
}

export interface UpdateUserDeps {
  repository: IUserManagementRepository;
}

export async function updateUser(input: UpdateUserInput, deps: UpdateUserDeps): Promise<User> {
  const { repository } = deps;

  const user = await repository.findUserByUuid(input.tenantId, input.userUuid);
  if (!user) {
    throw new UserNotFoundError(input.userUuid);
  }

  if (input.email && input.email !== user.email) {
    const existing = await repository.findUserByEmail(input.tenantId, input.email);
    if (existing && existing.uuid !== user.uuid) {
      throw new DuplicateUserEmailError(input.email);
    }
  }

  return repository.updateUser(input.tenantId, user.uuid, {
    companyUuid: input.companyUuid,
    branchUuid: input.branchUuid,
    departmentUuid: input.departmentUuid,
    firstName: input.firstName,
    middleName: input.middleName,
    lastName: input.lastName,
    displayName: input.displayName,
    email: input.email,
    mobileNumber: input.mobileNumber,
    updatedBy: input.updatedBy ?? null,
  });
}
