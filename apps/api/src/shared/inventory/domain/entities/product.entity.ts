import { ProductStatus } from "../enums/product-status.enum";

// Domain entity for a Product (00_BUSINESS_RULES.md Ch.34) — the master-data
// record describing an item a Company buys, sells, manufactures, or stocks:
// name, description, code, Product Category (Ch.35), Unit of Measure
// (Ch.36), Stocked/Non-Stocked classification, and Draft/Active/Discontinued
// lifecycle (Ch.34.5). Tenant-owned (06_DATABASE_STANDARDS.md MT-001),
// carrying `companyUuid` directly (cross-module reference, FK-002, no
// DB-level FK), mirroring Product Category's/Unit's own ownership shape.
// Data shape only — no lifecycle transition methods on this entity itself
// (mirroring Product Category's/Unit's own entity, not aggregate,
// placement); PRD-003 ("cannot be Discontinued while it has non-zero Stock")
// and Ch.34.12's "Stocked classification is fixed once transacted" are both
// Business-layer concerns for a later milestone, not implemented here.
// `productCategoryId`/`unitId` are real, in-module foreign keys
// (inventory.prisma FK-001) — plain bigints, no cross-repository
// existence validation, mirroring Account's own handling of
// `accountGroupId`/`parentAccountId`.
export class Product {
  constructor(
    public readonly id: bigint,
    public readonly uuid: string,
    public readonly tenantId: bigint,
    public readonly companyUuid: string,
    public readonly productCode: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly productCategoryId: bigint,
    public readonly unitId: bigint | null,
    public readonly isStocked: boolean,
    public readonly status: ProductStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    public readonly deletedAt: Date | null,
  ) {}
}

/** Fields required to persist a new Product row; identity/timestamps are assigned by the database. */
export interface CreateProductProps {
  companyUuid: string;
  productCode: string;
  name: string;
  description?: string | null;
  productCategoryId: bigint;
  unitId?: bigint | null;
  isStocked: boolean;
  status?: ProductStatus;
  createdBy?: bigint | null;
}

/** Fields a caller may revise on an existing Product row. */
export interface UpdateProductProps {
  productCode?: string;
  name?: string;
  description?: string | null;
  productCategoryId?: bigint;
  unitId?: bigint | null;
  isStocked?: boolean;
  status?: ProductStatus;
  updatedBy?: bigint | null;
}
