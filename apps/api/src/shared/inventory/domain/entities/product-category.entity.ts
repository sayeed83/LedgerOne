// Domain entity for a Product Category (00_BUSINESS_RULES.md Ch.35) — a
// hierarchical grouping of Products (Ch.34) for organization and
// category-level defaults (default Tax Group). Tenant-owned
// (06_DATABASE_STANDARDS.md MT-001), carrying `companyUuid` directly
// (cross-module reference, FK-002, no DB-level FK), mirroring Account
// Group's/Tax Group's own ownership shape. Data shape only — no lifecycle
// transition methods, since Ch.35.5 documents Product Category as "static,
// low-change reference data," mirroring Account Group's own entity (not
// aggregate) placement. Supports revision (name, parent, default Tax Group)
// via the Repository's update method, mirroring Account Group's own update
// support.
export class ProductCategory {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly name: string,
    public readonly parentProductCategoryId: bigint | null,
    public readonly defaultTaxGroupUuid: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Product Category row; identity/timestamps are assigned by the database. */
export interface CreateProductCategoryProps {
  companyUuid: string;
  name: string;
  parentProductCategoryId?: bigint | null;
  defaultTaxGroupUuid?: string | null;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Product Category row. */
export interface UpdateProductCategoryProps {
  name?: string;
  parentProductCategoryId?: bigint | null;
  defaultTaxGroupUuid?: string | null;
  updatedBy?: bigint | null;
}
