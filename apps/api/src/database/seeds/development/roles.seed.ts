// Development seed (04_FOLDER_STRUCTURE.md Ch.11.3) — a handful of standard
// Roles (00_BUSINESS_RULES.md Ch.11) under the dev fixture Tenant created by
// `organization.seed.ts` (runs first — alphabetically before this file in
// the same directory, per `scripts/db/run-seeds.ts`). Goes through the
// Business layer's `createRole` use case, never Prisma directly
// (05_CODING_STANDARDS.md Ch.9.5) — idempotent via `findRoleByName`, safe to
// re-run.
import { createOrganizationDependencies } from "../../../shared/organization/business/organization.composition";
import { TenantStatus } from "../../../shared/organization/domain/enums/tenant-status.enum";
import { createAuthorizationDependencies } from "../../../shared/authorization/business/authorization.composition";
import { createRole } from "../../../shared/authorization/business/create-role.service";

const DEV_TENANT_EMAIL = "dev-fixture@ledgerone.local";

const ROLES = [
  { name: "Administrator", description: "Full access across all modules.", isSystemRole: true },
  { name: "Accountant", description: "Manages accounting master data and journal entries.", isSystemRole: true },
  { name: "Viewer", description: "Read-only access.", isSystemRole: true },
];

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

  const authDeps = createAuthorizationDependencies();

  for (const role of ROLES) {
    const existing = await authDeps.repository.findRoleByName(tenant.id, role.name);
    if (existing) {
      console.log(`Role "${role.name}" already exists under dev Tenant, skipping.`);
      continue;
    }
    await createRole({ tenantId: tenant.id, ...role }, authDeps);
    console.log(`Seeded role "${role.name}" under dev Tenant ${tenant.uuid}.`);
  }
}
