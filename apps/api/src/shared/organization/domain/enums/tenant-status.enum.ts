// Plain TypeScript mirror of the Prisma `TenantStatus` enum
// (apps/api/src/database/schema/organization.prisma) — never imported from
// the Prisma-generated client (05_CODING_STANDARDS.md Ch.26.4/Ch.9.5). Values
// mirror 00_BUSINESS_RULES.md Ch.1.6's Organization lifecycle exactly and
// must exactly match the persisted Prisma enum values (Ch.26.4).
export enum TenantStatus {
  Provisioning = "PROVISIONING",
  Active = "ACTIVE",
  Suspended = "SUSPENDED",
  Deactivated = "DEACTIVATED",
}
