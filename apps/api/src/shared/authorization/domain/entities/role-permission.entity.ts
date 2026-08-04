// Domain entity for the Role↔Permission grant (00_BUSINESS_RULES.md
// Ch.11.3/Ch.12.10 — "Role grants Permission"). Tenant-owned
// (06_DATABASE_STANDARDS.md MT-001) even though reachable via Role, mirroring
// Organization's Branch/Department pattern of carrying `tenant_id` directly.
// Data shape only — no lifecycle transitions; a grant is created or removed,
// never partially updated.
export class RolePermission {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly roleId: bigint,
    public readonly permissionId: bigint,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}
