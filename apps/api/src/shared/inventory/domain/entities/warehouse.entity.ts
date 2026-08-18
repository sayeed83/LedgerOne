import { WarehouseStatus } from "../enums/warehouse-status.enum";

// Domain entity for a Warehouse (00_BUSINESS_RULES.md Ch.37) — a physical
// stock-keeping location within a Branch (Ch.3) where Inventory (Ch.38) is
// physically held: code, name, description, and Active/Inactive lifecycle
// (Ch.37.5). Tenant-owned (06_DATABASE_STANDARDS.md MT-001), carrying
// `branchUuid` directly (cross-module reference, FK-002, no DB-level FK) —
// Warehouse's real parent per WHS-001/Ch.37.9/37.10 is Branch, not Company
// (see inventory.prisma's own file-level Handbook Deviation note from the
// Database milestone), mirroring Product's/Unit's/Product Category's own
// `companyUuid` ownership shape. Data shape only — no lifecycle transition
// methods on this entity itself (mirroring Product's own entity, not
// aggregate, placement); WHS-002 ("cannot be deactivated while it holds
// non-zero Stock") is a Business-layer concern for a later milestone, not
// implemented here.
export class Warehouse {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly branchUuid: string,
    public readonly warehouseCode: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly status: WarehouseStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Warehouse row; identity/timestamps are assigned by the database. */
export interface CreateWarehouseProps {
  branchUuid: string;
  warehouseCode: string;
  name: string;
  description?: string | null;
  status?: WarehouseStatus;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Warehouse row. */
export interface UpdateWarehouseProps {
  warehouseCode?: string;
  name?: string;
  description?: string | null;
  status?: WarehouseStatus;
  updatedBy?: bigint | null;
}
