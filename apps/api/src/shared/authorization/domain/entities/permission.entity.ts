import { PermissionAction } from "../enums/permission-action.enum";

// Domain entity for a Permission (00_BUSINESS_RULES.md Ch.12) — the finest-
// grained unit of access control, keyed by the `module.resource.action`
// convention (03_ARCHITECTURE.md Ch.9.5/Decision 9.9.1). Platform-owned
// reference data (06_DATABASE_STANDARDS.md MT-005) declared by its owning
// module, never created ad hoc by this module (Ch.12.5/12.8) — this
// Repository layer is read-only for Permission (find/list only, no
// create/update methods), so this file carries no `CreateProps`/`UpdateProps`.
// Data shape only, mirroring Organization's Branch/Department entities.
export class Permission {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly permissionKey: string,
    public readonly moduleName: string,
    public readonly resource: string,
    public readonly action: PermissionAction,
    public readonly description: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly deletedAt: Date | null,
  ) {}
}
