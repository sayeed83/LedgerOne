// Business layer — reads a Branch by its external identifier, scoped to
// the supplied Tenant (00_BUSINESS_RULES.md BRN-001). Never resolves by the
// internal `id` (06_DATABASE_STANDARDS.md PK-003).
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Branch } from "../domain/entities/branch.entity";
import { TenantNotFoundError, BranchNotFoundError } from "../domain/errors/organization.errors";

export interface GetBranchInput {
  tenantUuid: string;
  branchUuid: string;
}

export interface GetBranchDeps {
  repository: IOrganizationRepository;
}

export async function getBranch(input: GetBranchInput, deps: GetBranchDeps): Promise<Branch> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const branch = await repository.findBranchByUuid(tenant.id, input.branchUuid);
  if (!branch) {
    throw new BranchNotFoundError(input.branchUuid);
  }

  return branch;
}
