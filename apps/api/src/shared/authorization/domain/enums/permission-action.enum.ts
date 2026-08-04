// Plain TypeScript mirror of the Prisma `PermissionAction` enum
// (apps/api/src/database/schema/authorization.prisma) — never imported from
// the Prisma-generated client (05_CODING_STANDARDS.md Ch.26.4/Ch.9.5). Values
// mirror 00_BUSINESS_RULES.md PRM-002's action-type categorization exactly
// and must exactly match the persisted Prisma enum values (Ch.26.4).
export enum PermissionAction {
  View = "VIEW",
  Create = "CREATE",
  Edit = "EDIT",
  Approve = "APPROVE",
  Delete = "DELETE",
}
