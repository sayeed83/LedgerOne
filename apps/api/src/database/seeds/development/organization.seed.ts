// Development seed (04_FOLDER_STRUCTURE.md Ch.11.3) — a single dev-only
// Tenant + Company fixture (00_BUSINESS_RULES.md Ch.1/Ch.2), gated to
// local/CI only (Ch.11.11), never run against staging/production. Exists so
// tenant-owned master-data seeds (roles, tax groups) have a real Tenant/
// Company to attach to. Goes through the Business layer's `createTenant`/
// `createCompany`/`activateTenant`/`activateCompany` use cases, never Prisma
// directly (05_CODING_STANDARDS.md Ch.9.5) — idempotent by natural key
// (`primaryContactEmail`, `companyCode`), safe to re-run.
import { createOrganizationDependencies } from "../../../shared/organization/business/organization.composition";
import { createTenant } from "../../../shared/organization/business/create-tenant.service";
import { activateTenant } from "../../../shared/organization/business/activate-tenant.service";
import { createCompany } from "../../../shared/organization/business/create-company.service";
import { activateCompany } from "../../../shared/organization/business/activate-company.service";
import { TenantStatus } from "../../../shared/organization/domain/enums/tenant-status.enum";

const DEV_TENANT_EMAIL = "dev-fixture@ledgerone.local";
const DEV_TENANT_LEGAL_NAME = "LedgerOne Dev Fixture Tenant";
const DEV_COMPANY_CODE = "DEV-CO";

export async function seed(): Promise<void> {
  const deps = createOrganizationDependencies();

  const existingTenants = [
    ...(await deps.repository.findTenantsByStatus(TenantStatus.Active)),
    ...(await deps.repository.findTenantsByStatus(TenantStatus.Provisioning)),
  ];
  let tenant = existingTenants.find((t) => t.primaryContactEmail === DEV_TENANT_EMAIL);

  if (!tenant) {
    tenant = await createTenant({ legalName: DEV_TENANT_LEGAL_NAME, primaryContactEmail: DEV_TENANT_EMAIL }, deps);
    await activateTenant({ tenantUuid: tenant.uuid }, deps);
    console.log(`Seeded dev Tenant ${tenant.uuid}.`);
  } else {
    console.log(`Dev Tenant ${tenant.uuid} already exists, skipping.`);
  }

  const existingCompanies = await deps.repository.listCompaniesByTenant(tenant.id);
  let company = existingCompanies.find((c) => c.companyCode === DEV_COMPANY_CODE);

  if (!company) {
    company = await createCompany(
      {
        tenantUuid: tenant.uuid,
        companyCode: DEV_COMPANY_CODE,
        legalName: "LedgerOne Dev Fixture Company",
        taxRegistrationNumber: "DEV-TAX-0001",
        baseCurrencyCode: "USD",
        country: "US",
        timeZone: "America/New_York",
        financialYearStartMonth: 4,
        financialYearStartDay: 1,
      },
      deps,
    );
    await activateCompany({ tenantUuid: tenant.uuid, companyUuid: company.uuid }, deps);
    console.log(`Seeded dev Company ${company.uuid} under Tenant ${tenant.uuid}.`);
  } else {
    console.log(`Dev Company ${company.uuid} already exists, skipping.`);
  }
}
