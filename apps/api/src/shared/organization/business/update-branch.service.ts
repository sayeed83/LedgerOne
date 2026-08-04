// Business layer — revises a Branch's identifying/address details. Status
// transitions are not part of this milestone (mirrors the Repository
// interface, 05_CODING_STANDARDS.md Ch.14.4). If `branchCode` is being
// changed, the new code must still be unique within the Branch's Company
// (mirrors create-branch.service.ts's check).
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Branch } from "../domain/entities/branch.entity";
import { TenantNotFoundError, BranchNotFoundError, DuplicateBranchCodeError } from "../domain/errors/organization.errors";

export interface UpdateBranchInput {
  tenantUuid: string;
  branchUuid: string;
  branchCode?: string;
  branchName?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  city?: string;
  region?: string | null;
  postalCode?: string | null;
  countryCode?: string;
  timeZone?: string;
  updatedBy?: bigint | null;
}

export interface UpdateBranchDeps {
  repository: IOrganizationRepository;
}

export async function updateBranch(input: UpdateBranchInput, deps: UpdateBranchDeps): Promise<Branch> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const branch = await repository.findBranchByUuid(tenant.id, input.branchUuid);
  if (!branch) {
    throw new BranchNotFoundError(input.branchUuid);
  }

  if (input.branchCode && input.branchCode !== branch.branchCode) {
    const existingBranches = await repository.listBranchesByCompany(tenant.id, branch.companyId);
    if (existingBranches.some((other) => other.uuid !== branch.uuid && other.branchCode === input.branchCode)) {
      throw new DuplicateBranchCodeError(input.branchCode);
    }
  }

  return repository.updateBranch(tenant.id, branch.uuid, {
    branchCode: input.branchCode,
    branchName: input.branchName,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
    city: input.city,
    region: input.region,
    postalCode: input.postalCode,
    countryCode: input.countryCode,
    timeZone: input.timeZone,
    updatedBy: input.updatedBy ?? null,
  });
}
