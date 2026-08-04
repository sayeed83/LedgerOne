// Business layer — reads a Tenant's organization-wide default settings
// (00_BUSINESS_RULES.md ORG-003). Persistence-only via IOrganizationRepository.
import { IOrganizationRepository } from "../domain/interfaces/organization-repository.interface";
import { TenantSettings } from "../domain/entities/tenant-settings.entity";
import { TenantNotFoundError, TenantSettingsNotFoundError } from "../domain/errors/organization.errors";

export interface GetTenantSettingsInput {
  tenantUuid: string;
}

export interface GetTenantSettingsDeps {
  repository: IOrganizationRepository;
}

export async function getTenantSettings(
  input: GetTenantSettingsInput,
  deps: GetTenantSettingsDeps,
): Promise<TenantSettings> {
  const { repository } = deps;

  const tenant = await repository.findTenantByUuid(input.tenantUuid);
  if (!tenant) {
    throw new TenantNotFoundError(input.tenantUuid);
  }

  const settings = await repository.getTenantSettings(tenant.id);
  if (!settings) {
    throw new TenantSettingsNotFoundError(input.tenantUuid);
  }

  return settings;
}
