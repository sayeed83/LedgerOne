// Domain entity for the User↔Role assignment (00_BUSINESS_RULES.md
// Ch.10/Ch.11.10 — "User assigned Role"; 03_ARCHITECTURE.md Ch.9.5 Role
// Assignment). Tenant-owned (06_DATABASE_STANDARDS.md MT-001). `userUuid` is
// a cross-module reference (FK-002) to User Management's `users.uuid` — no
// DB-level foreign key. Data shape only — no lifecycle transitions; an
// assignment is created or removed, never partially updated.
export class UserRole {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly userUuid: string,
    public readonly roleId: bigint,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}
