// Business layer — revises a Tenant's organization-wide default settings
// (00_BUSINESS_RULES.md ORG-003). Requires the TenantSettings row to already
// exist; provisioning the initial row is a separate concern outside this
// use case's scope.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { TenantSettings } from "../domain/entities/tenant-settings.entity";
import { TenantNotFoundError, TenantSettingsNotFoundError } from "../domain/errors/organization.errors";

export interface UpdateTenantSettingsInput {
  tenantUuid: string;
  defaultCurrencyCode?: string;
  defaultTimeZone?: string;
  defaultFinancialYearPattern?: string;
  updatedBy?: bigint | null;
}

export interface UpdateTenantSettingsDeps {
  repository: IOrganizationRepository;
}

export async function updateTenantSettings(
  input: UpdateTenantSettingsInput,
  deps: UpdateTenantSettingsDeps,
): Promise<TenantSettings> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const existing = await repository.getTenantSettings(tenant.id);
  if (!existing) {
    throw new TenantSettingsNotFoundError(input.tenantUuid);
  }

  return repository.updateTenantSettings(tenant.id, {
    defaultCurrencyCode: input.defaultCurrencyCode,
    defaultTimeZone: input.defaultTimeZone,
    defaultFinancialYearPattern: input.defaultFinancialYearPattern,
    updatedBy: input.updatedBy ?? null,
  });
}
