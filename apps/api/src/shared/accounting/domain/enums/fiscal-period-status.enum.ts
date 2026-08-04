// Plain TypeScript mirror of the Prisma `FiscalPeriodStatus` enum
// (apps/api/src/database/schema/accounting.prisma) — never imported from the
// Prisma-generated client (05_CODING_STANDARDS.md Ch.26.4/Ch.9.5). Values
// mirror 00_BUSINESS_RULES.md Ch.6.5's Fiscal Period lifecycle exactly and
// must exactly match the persisted Prisma enum values (Ch.26.4).
export enum FiscalPeriodStatus {
  Open = "OPEN",
  SoftClosed = "SOFT_CLOSED",
  Closed = "CLOSED",
  Reopened = "REOPENED",
}
