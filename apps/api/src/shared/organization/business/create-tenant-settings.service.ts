// Business layer — provisions a Tenant's organization-wide default settings
// (00_BUSINESS_RULES.md ORG-003, Ch.1.7's onboarding step "Organization-wide
// defaults configured"). Persistence-only via IOrganizationRepository. Values
// are supplied by the caller (the Organization Administrator, per Ch.1.7) —
// this service never invents a default Currency/Time Zone/Financial Year
// pattern of its own, since none is documented in the handbook. One-to-one
// with Tenant (`tenant_id` unique, organization.prisma) — a second call for
// the same Tenant is rejected via TenantSettingsAlreadyExistsError, mirroring
// Stock's own StockAlreadyExistsError uniqueness-guard pattern.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { TenantSettings } from "../domain/entities/tenant-settings.entity";
import { TenantNotFoundError, TenantSettingsAlreadyExistsError } from "../domain/errors/organization.errors";

export interface CreateTenantSettingsInput {
  tenantUuid: string;
  defaultCurrencyCode: string;
  defaultTimeZone: string;
  defaultFinancialYearPattern: string;
  createdBy?: bigint | null;
}

export interface CreateTenantSettingsDeps {
  repository: IOrganizationRepository;
}

export async function createTenantSettings(
  input: CreateTenantSettingsInput,
  deps: CreateTenantSettingsDeps,
): Promise<TenantSettings> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const existing = await repository.getTenantSettings(tenant.id);
  if (existing) {
    throw new TenantSettingsAlreadyExistsError(input.tenantUuid);
  }

  return repository.createTenantSettings(tenant.id, {
    defaultCurrencyCode: input.defaultCurrencyCode,
    defaultTimeZone: input.defaultTimeZone,
    defaultFinancialYearPattern: input.defaultFinancialYearPattern,
    createdBy: input.createdBy ?? null,
  });
}
