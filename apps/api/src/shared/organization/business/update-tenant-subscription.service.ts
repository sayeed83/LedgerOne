// Business layer — revises a Tenant's commercial subscription record
// (00_BUSINESS_RULES.md Ch.1.4/ORG-004). Requires the TenantSubscription row
// to already exist; provisioning the initial row is a separate concern
// outside this use case's scope.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { TenantSubscription } from "../domain/entities/tenant-subscription.entity";
import { TenantSubscriptionStatus } from "../domain/enums/tenant-subscription-status.enum";
import { TenantNotFoundError, TenantSubscriptionNotFoundError } from "../domain/errors/organization.errors";

export interface UpdateTenantSubscriptionInput {
  tenantUuid: string;
  planCode?: string;
  subscribedModules?: string[];
  status?: TenantSubscriptionStatus;
  currentPeriodStartsAt?: Date;
  currentPeriodEndsAt?: Date;
  cancelledAt?: Date | null;
  updatedBy?: bigint | null;
}

export interface UpdateTenantSubscriptionDeps {
  repository: IOrganizationRepository;
}

export async function updateTenantSubscription(
  input: UpdateTenantSubscriptionInput,
  deps: UpdateTenantSubscriptionDeps,
): Promise<TenantSubscription> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const existing = await repository.getTenantSubscription(tenant.id);
  if (!existing) {
    throw new TenantSubscriptionNotFoundError(input.tenantUuid);
  }

  return repository.updateTenantSubscription(tenant.id, {
    planCode: input.planCode,
    subscribedModules: input.subscribedModules,
    status: input.status,
    currentPeriodStartsAt: input.currentPeriodStartsAt,
    currentPeriodEndsAt: input.currentPeriodEndsAt,
    cancelledAt: input.cancelledAt,
    updatedBy: input.updatedBy ?? null,
  });
}
