// Development seed (04_FOLDER_STRUCTURE.md Ch.11.3) — a handful of standard
// Tax Groups (00_BUSINESS_RULES.md Ch.67) under the dev fixture Tenant/
// Company created by `organization.seed.ts` (runs first — alphabetically
// before this file in the same directory, per `scripts/db/run-seeds.ts`).
// Goes through the Business layer's `createTaxGroup` use case, never Prisma
// directly (05_CODING_STANDARDS.md Ch.9.5) — idempotent via `listTaxGroups`,
// safe to re-run.
import { createOrganizationDependencies } from "../../../shared/organization/business/organization.composition";
import { TenantStatus } from "../../../shared/organization/domain/enums/tenant-status.enum";
import { createAccountingDependencies } from "../../../shared/accounting/business/accounting.composition";
import { createTaxGroup } from "../../../shared/accounting/business/create-tax-group.service";

const DEV_TENANT_EMAIL = "dev-fixture@ledgerone.local";
const DEV_COMPANY_CODE = "DEV-CO";

const TAX_GROUPS = ["Standard Rate", "Zero Rate", "Exempt"];

export async function seed(): Promise<void> {
  const orgDeps = createOrganizationDependencies();
  const existingTenants = [
    ...(await orgDeps.repository.findTenantsByStatus(TenantStatus.Active)),
    ...(await orgDeps.repository.findTenantsByStatus(TenantStatus.Provisioning)),
  ];
  const tenant = existingTenants.find((t) => t.primaryContactEmail === DEV_TENANT_EMAIL);
  if (!tenant) {
    throw new Error("Dev fixture Tenant not found — organization.seed.ts must run first.");
  }

  const companies = await orgDeps.repository.listCompaniesByTenant(tenant.id);
  const company = companies.find((c) => c.companyCode === DEV_COMPANY_CODE);
  if (!company) {
    throw new Error("Dev fixture Company not found — organization.seed.ts must run first.");
  }

  const accountingDeps = createAccountingDependencies();
  const existingGroups = await accountingDeps.repository.listTaxGroups(tenant.id, company.uuid);

  for (const name of TAX_GROUPS) {
    if (existingGroups.some((group) => group.name === name)) {
      console.log(`Tax Group "${name}" already exists under dev Company, skipping.`);
      continue;
    }
    await createTaxGroup({ tenantId: tenant.id, companyUuid: company.uuid, name }, accountingDeps);
    console.log(`Seeded Tax Group "${name}" under dev Company ${company.uuid}.`);
  }
}
