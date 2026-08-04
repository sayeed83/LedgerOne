// Business layer — provisions a new Tenant (00_BUSINESS_RULES.md Ch.1.6:
// enters the Provisioning state, per TenantStatus's `@default(PROVISIONING)`).
// Persistence-only via IOrganizationRepository (never Prisma directly).
// TenantSettings/TenantSubscription provisioning is a separate concern
// (UpdateTenantSettings/UpdateTenantSubscription act on rows created via
// their own dedicated flow) — out of scope for this use case.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { Tenant } from "../domain/aggregates/tenant.aggregate";

export interface CreateTenantInput {
  legalName: string;
  primaryContactEmail: string;
  createdBy?: bigint | null;
}

export interface CreateTenantDeps {
  repository: IOrganizationRepository;
}

export async function createTenant(input: CreateTenantInput, deps: CreateTenantDeps): Promise<Tenant> {
  const { repository } = deps;

  return repository.createTenant({
    legalName: input.legalName,
    primaryContactEmail: input.primaryContactEmail,
    createdBy: input.createdBy ?? null,
  });
}
