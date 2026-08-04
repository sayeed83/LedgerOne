// Business layer — reads a Tenant's commercial subscription record
// (00_BUSINESS_RULES.md Ch.1.4/ORG-004). Persistence-only via
// IOrganizationRepository.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { TenantSubscription } from "../domain/entities/tenant-subscription.entity";
import { TenantNotFoundError, TenantSubscriptionNotFoundError } from "../domain/errors/organization.errors";

export interface GetTenantSubscriptionInput {
  tenantUuid: string;
}

export interface GetTenantSubscriptionDeps {
  repository: IOrganizationRepository;
}

export async function getTenantSubscription(
  input: GetTenantSubscriptionInput,
  deps: GetTenantSubscriptionDeps,
): Promise<TenantSubscription> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const subscription = await repository.getTenantSubscription(tenant.id);
  if (!subscription) {
    throw new TenantSubscriptionNotFoundError(input.tenantUuid);
  }

  return subscription;
}
