// Development seed (04_FOLDER_STRUCTURE.md Ch.11.3) — three dev fixture
// Users, one per seeded Role (`roles.seed.ts`, which must run first —
// alphabetically before this file in the same directory, per
// `scripts/db/run-seeds.ts`), under the dev fixture Tenant/Company created
// by `organization.seed.ts`. Goes through the User Management/Authorization
// Business layers' use cases for the User row and Role assignment, never
// Prisma directly (05_CODING_STANDARDS.md Ch.9.5). The one exception is the
// login credential itself: Authentication intentionally exposes no
// "register" use case (00_BUSINESS_RULES.md's own documented gap — see
// engineering/testing/authentication/Authentication_API_Documentation.md
// §0.4, "a user_credentials row must be seeded directly... before /login
// can ever succeed") so this seed calls the Authentication repository's
// `createCredential` directly via its own composition root, hashing the
// password with the same Argon2 hasher the real login path verifies against
// (PWD-002). Idempotent via `findUserByEmail`/`findCredentialByEmail`/
// `listRolesForUser`, safe to re-run.
import { createOrganizationDependencies } from "../../../shared/organization/business/organization.composition";
import { TenantStatus } from "../../../shared/organization/domain/enums/tenant-status.enum";
import { createUserManagementDependencies } from "../../../shared/user-management/business/user-management.composition";
import { createUser } from "../../../shared/user-management/business/create-user.service";
import { activateUser } from "../../../shared/user-management/business/activate-user.service";
import { createAuthenticationDependencies } from "../../../shared/authentication/business/authentication.composition";
import { createAuthorizationDependencies } from "../../../shared/authorization/business/authorization.composition";
import { assignRole } from "../../../shared/authorization/business/assign-role.service";

const DEV_TENANT_EMAIL = "dev-fixture@ledgerone.local";
const DEV_COMPANY_CODE = "DEV-CO";

const USERS = [
  {
    email: "admin@ledgerone-dev.local",
    firstName: "Ada",
    lastName: "Admin",
    password: "Adm1n#LedgerOne25",
    roleName: "Administrator",
  },
  {
    email: "accountant@ledgerone-dev.local",
    firstName: "Cara",
    lastName: "Accountant",
    password: "Acct#LedgerOne25",
    roleName: "Accountant",
  },
  {
    email: "viewer@ledgerone-dev.local",
    firstName: "Vic",
    lastName: "Viewer",
    password: "View#LedgerOne25",
    roleName: "Viewer",
  },
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

  const companies = await orgDeps.repository.listCompaniesByTenant(tenant.id);
  const company = companies.find((c) => c.companyCode === DEV_COMPANY_CODE);
  if (!company) {
    throw new Error("Dev fixture Company not found — organization.seed.ts must run first.");
  }

  const userDeps = createUserManagementDependencies();
  const authnDeps = createAuthenticationDependencies();
  const authzDeps = createAuthorizationDependencies();

  console.log("== Dev fixture user credentials (local dev only) ==");

  for (const fixture of USERS) {
    let user = await userDeps.repository.findUserByEmail(tenant.id, fixture.email);
    if (!user) {
      user = await createUser(
        {
          tenantId: tenant.id,
          companyUuid: company.uuid,
          firstName: fixture.firstName,
          lastName: fixture.lastName,
          email: fixture.email,
        },
        userDeps,
      );
      await activateUser({ tenantId: tenant.id, userUuid: user.uuid }, userDeps);
      console.log(`Seeded User ${fixture.email} (${user.uuid}).`);
    } else {
      console.log(`User ${fixture.email} already exists, skipping User creation.`);
    }

    const existingCredential = await authnDeps.repository.findCredentialByEmail(tenant.id, fixture.email);
    if (!existingCredential) {
      const passwordHash = await authnDeps.passwordHasher.hash(fixture.password);
      await authnDeps.repository.createCredential(tenant.id, {
        tenantId: tenant.id,
        userUuid: user.uuid,
        email: fixture.email,
        passwordHash,
      });
      console.log(`Seeded credential for ${fixture.email}.`);
    } else {
      console.log(`Credential for ${fixture.email} already exists, skipping.`);
    }

    const role = await authzDeps.repository.findRoleByName(tenant.id, fixture.roleName);
    if (!role) {
      throw new Error(`Role "${fixture.roleName}" not found — roles.seed.ts must run first.`);
    }
    const existingAssignments = await authzDeps.repository.listRolesForUser(tenant.id, user.uuid);
    if (!existingAssignments.some((assigned) => assigned.uuid === role.uuid)) {
      await assignRole({ tenantId: tenant.id, userUuid: user.uuid, roleUuid: role.uuid }, authzDeps);
      console.log(`Assigned role "${fixture.roleName}" to ${fixture.email}.`);
    } else {
      console.log(`Role "${fixture.roleName}" already assigned to ${fixture.email}, skipping.`);
    }

    console.log(`  ${fixture.roleName.padEnd(14)} email: ${fixture.email.padEnd(32)} password: ${fixture.password}`);
  }
}
