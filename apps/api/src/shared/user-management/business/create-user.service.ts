// Business layer — registers a new User under a Tenant (00_BUSINESS_RULES.md
// Ch.10.1: one Organization, no reassignment). The email must be unique
// within the Tenant (Ch.10.8) — checked here rather than left to a raw
// Prisma constraint violation bubbling out of the Repository layer
// (05_CODING_STANDARDS.md Ch.18.3). `tenantId` arrives already resolved
// (this module does not own Tenant/Company/Branch/Department — Organization
// does — so, mirroring Authentication's own services, this layer takes the
// numeric id directly rather than resolving a `tenantUuid` itself).
// `companyUuid`/`branchUuid`/`departmentUuid` are trusted as given: verifying
// they reference a real, active Organization row is a cross-module concern
// with no sanctioned contract yet (03_ARCHITECTURE.md Ch.9.4 — a module may
// only reach another module through its declared public contract, and
// Organization does not currently expose one usable outside its own
// Presentation layer), so it is out of scope for this module's Business
// layer and is left to whichever layer orchestrates User creation together
// with Organization.
import { IUserManagementRepository } from "../domain/interfaces/user-management-repository.interface";
import { User } from "../domain/aggregates/user.aggregate";
import { DuplicateUserEmailError } from "../domain/errors/user-management.errors";

export interface CreateUserInput {
  tenantId: bigint;
  companyUuid: string;
  branchUuid?: string | null;
  departmentUuid?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  displayName?: string | null;
  email: string;
  mobileNumber?: string | null;
  createdBy?: bigint | null;
}

export interface CreateUserDeps {
  repository: IUserManagementRepository;
}

export async function createUser(input: CreateUserInput, deps: CreateUserDeps): Promise<User> {
  const { repository } = deps;

  const existing = await repository.findUserByEmail(input.tenantId, input.email);
  if (existing) {
    throw new DuplicateUserEmailError(input.email);
  }

  return repository.createUser(input.tenantId, {
    companyUuid: input.companyUuid,
    branchUuid: input.branchUuid ?? null,
    departmentUuid: input.departmentUuid ?? null,
    firstName: input.firstName,
    middleName: input.middleName ?? null,
    lastName: input.lastName,
    displayName: input.displayName ?? null,
    email: input.email,
    mobileNumber: input.mobileNumber ?? null,
    createdBy: input.createdBy ?? null,
  });
}
