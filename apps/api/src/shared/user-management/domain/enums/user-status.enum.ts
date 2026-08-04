// Plain TypeScript mirror of the Prisma `UserStatus` enum
// (apps/api/src/database/schema/user-management.prisma) — never imported from
// the Prisma-generated client (05_CODING_STANDARDS.md Ch.26.4/Ch.9.5). Values
// mirror 00_BUSINESS_RULES.md Ch.10.5's User lifecycle exactly and must
// exactly match the persisted Prisma enum values (Ch.26.4).
export enum UserStatus {
  Invited = "INVITED",
  Active = "ACTIVE",
  Suspended = "SUSPENDED",
  Deactivated = "DEACTIVATED",
}
