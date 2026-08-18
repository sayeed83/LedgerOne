// Repository layer for the Inventory module — persistence only. No
// sibling-name-uniqueness validation (Ch.35.8), no default-Tax-Group
// inheritance resolution (Ch.35.3/PCT-002), no HTTP concerns
// (05_CODING_STANDARDS.md Ch.14.4). `product_categories` is tenant-owned
// (MT-001) — every query below asserts `tenantId` explicitly. Only this
// folder (and the shared Prisma client module itself) may import the Prisma
// client, per Ch.9.5.
import { randomUUID } from "crypto";
import { prisma, PrismaTransactionClient } from "../../../database/client";
import { ProductCategory as ProductCategoryModel } from "../../../database/generated/client";
import {
  ProductCategory,
  CreateProductCategoryProps,
  UpdateProductCategoryProps,
} from "../domain/entities/product-category.entity";
import { ProductCategoryNotFoundError } from "../domain/errors/inventory.errors";
import { IInventoryRepository, RepositoryTransaction } from "../domain/interfaces/inventory-repository.interface";

function newUuid(): string {
  return randomUUID();
}

function toProductCategoryDomain(row: ProductCategoryModel): ProductCategory {
  return new ProductCategory(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyUuid,
    row.name,
    row.parentProductCategoryId,
    row.defaultTaxGroupUuid,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

export class PrismaInventoryRepository implements IInventoryRepository {
  private client(tx?: RepositoryTransaction): PrismaTransactionClient | typeof prisma {
    return (tx as PrismaTransactionClient | undefined) ?? prisma;
  }

  // ProductCategory is tenant-owned (06_DATABASE_STANDARDS.md MT-001) —
  // every query below asserts `tenantId` explicitly and independently, never
  // trusting a previously-resolved row (MT-002, Ch.6.4's worked example).
  // `id` is never accepted from outside this file (PK-003) — mutations key
  // on `(tenantId, uuid)`. `parentProductCategoryId` is a real, in-module FK
  // (inventory.prisma) and `defaultTaxGroupUuid` is a cross-module reference
  // (FK-002) — neither is validated for existence here (a future
  // Business-layer concern, mirroring Accounting's own handling of
  // `financialYearId`/`fromCurrencyId`).

  async createProductCategory(
    tenantId: bigint,
    props: CreateProductCategoryProps,
    tx?: RepositoryTransaction,
  ): Promise<ProductCategory> {
    const row = await this.client(tx).productCategory.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyUuid: props.companyUuid,
        name: props.name,
        parentProductCategoryId: props.parentProductCategoryId ?? null,
        defaultTaxGroupUuid: props.defaultTaxGroupUuid ?? null,
        createdBy: props.createdBy ?? null,
      },
    });
    return toProductCategoryDomain(row);
  }

  async findProductCategoryByUuid(tenantId: bigint, uuid: string): Promise<ProductCategory | null> {
    const row = await prisma.productCategory.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toProductCategoryDomain(row) : null;
  }

  async listProductCategories(tenantId: bigint, companyUuid?: string): Promise<ProductCategory[]> {
    const rows = await prisma.productCategory.findMany({
      where: { tenantId, companyUuid, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return rows.map(toProductCategoryDomain);
  }

  async updateProductCategory(
    tenantId: bigint,
    uuid: string,
    props: UpdateProductCategoryProps,
    tx?: RepositoryTransaction,
  ): Promise<ProductCategory> {
    const client = this.client(tx);
    const { count } = await client.productCategory.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        name: props.name,
        parentProductCategoryId: props.parentProductCategoryId,
        defaultTaxGroupUuid: props.defaultTaxGroupUuid,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new ProductCategoryNotFoundError(uuid);
    }
    const row = await client.productCategory.findFirst({ where: { tenantId, uuid } });
    return toProductCategoryDomain(row as ProductCategoryModel);
  }
}
