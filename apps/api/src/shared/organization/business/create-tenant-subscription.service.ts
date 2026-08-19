// Business layer — provisions a Tenant's commercial subscription record
// (00_BUSINESS_RULES.md Ch.1.4/ORG-004). Persistence-only via
// IOrganizationRepository. `planCode`/`subscribedModules`/period dates are
// all supplied by the caller — no default plan or module list is documented
// in the handbook (Ch.1.22 explicitly defers "Organization-level billing and
// subscription self-service" as future work), so none is invented here.
// `status` always starts at its schema default (Provisioning,
// TenantSubscriptionStatus) — never accepted as create input, mirroring
// Role's own `isSystemRole` platform-controlled-attribute reasoning; only
// `updateTenantSubscription` may change it. One-to-one with Tenant
// (`tenant_id` unique) — a second call for the same Tenant is rejected via
// TenantSubscriptionAlreadyExistsError.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { TenantSubscription } from "../domain/entities/tenant-subscription.entity";
import { TenantNotFoundError, TenantSubscriptionAlreadyExistsError } from "../domain/errors/organization.errors";

export interface CreateTenantSubscriptionInput {
  tenantUuid: string;
  planCode: string;
  subscribedModules: string[];
  currentPeriodStartsAt: Date;
  currentPeriodEndsAt: Date;
  createdBy?: bigint | null;
}

export interface CreateTenantSubscriptionDeps {
  repository: IOrganizationRepository;
}

export async function createTenantSubscription(
  input: CreateTenantSubscriptionInput,
  deps: CreateTenantSubscriptionDeps,
): Promise<TenantSubscription> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const existing = await repository.getTenantSubscription(tenant.id);
  if (existing) {
    throw new TenantSubscriptionAlreadyExistsError(input.tenantUuid);
  }

  return repository.createTenantSubscription(tenant.id, {
    planCode: input.planCode,
    subscribedModules: input.subscribedModules,
    currentPeriodStartsAt: input.currentPeriodStartsAt,
    currentPeriodEndsAt: input.currentPeriodEndsAt,
    createdBy: input.createdBy ?? null,
  });
}
