// Repository layer for the Inventory module — persistence only. No
// sibling-name-uniqueness validation (Ch.35.8), no default-Tax-Group
// inheritance resolution (Ch.35.3/PCT-002), no HTTP concerns
// (05_CODING_STANDARDS.md Ch.14.4). `product_categories` is tenant-owned
// (MT-001) — every query below asserts `tenantId` explicitly. Only this
// folder (and the shared Prisma client module itself) may import the Prisma
// client, per Ch.9.5.
import { randomUUID } from "crypto";
import { prisma, PrismaTransactionClient } from "../../../database/client";
import {
  ProductCategory as ProductCategoryModel,
  Unit as UnitModel,
  Product as ProductModel,
  ProductStatus as PrismaProductStatus,
} from "../../../database/generated/client";
import {
  ProductCategory,
  CreateProductCategoryProps,
  UpdateProductCategoryProps,
} from "../domain/entities/product-category.entity";
import { Unit, CreateUnitProps, UpdateUnitProps } from "../domain/entities/unit.entity";
import { Product, CreateProductProps, UpdateProductProps } from "../domain/entities/product.entity";
import { ProductStatus } from "../domain/enums/product-status.enum";
import { ProductCategoryNotFoundError, UnitNotFoundError, ProductNotFoundError } from "../domain/errors/inventory.errors";
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

/// `.toFixed()` (not `.toString()`) guarantees plain fixed-point decimal
/// notation, never exponential notation, mirroring Accounting's own
/// `DecimalValue`-bound mapping — kept as a plain string here since a
/// cross-module Domain import is architecturally forbidden at this layer
/// (see unit.entity.ts's own header comment).
function toUnitDomain(row: UnitModel): Unit {
  return new Unit(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyUuid,
    row.name,
    row.symbol,
    row.baseUnitId,
    row.conversionFactor ? row.conversionFactor.toFixed() : null,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

function toProductDomain(row: ProductModel): Product {
  return new Product(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyUuid,
    row.productCode,
    row.name,
    row.description,
    row.productCategoryId,
    row.unitId,
    row.isStocked,
    row.status as unknown as ProductStatus,
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

  // Unit is tenant-owned (06_DATABASE_STANDARDS.md MT-001) — every query
  // below asserts `tenantId` explicitly and independently, never trusting a
  // previously-resolved row (MT-002, Ch.6.4's worked example). `id` is
  // never accepted from outside this file (PK-003) — mutations key on
  // `(tenantId, uuid)`. `baseUnitId` is a real, in-module FK
  // (inventory.prisma) — not validated for existence here (a future
  // Business-layer concern, mirroring Accounting's own handling of
  // `financialYearId`/`fromCurrencyId`).

  async createUnit(tenantId: bigint, props: CreateUnitProps, tx?: RepositoryTransaction): Promise<Unit> {
    const row = await this.client(tx).unit.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyUuid: props.companyUuid,
        name: props.name,
        symbol: props.symbol,
        baseUnitId: props.baseUnitId ?? null,
        conversionFactor: props.conversionFactor ?? null,
        createdBy: props.createdBy ?? null,
      },
    });
    return toUnitDomain(row);
  }

  async updateUnit(tenantId: bigint, uuid: string, props: UpdateUnitProps, tx?: RepositoryTransaction): Promise<Unit> {
    const client = this.client(tx);
    const { count } = await client.unit.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        name: props.name,
        symbol: props.symbol,
        baseUnitId: props.baseUnitId,
        conversionFactor: props.conversionFactor,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new UnitNotFoundError(uuid);
    }
    const row = await client.unit.findFirst({ where: { tenantId, uuid } });
    return toUnitDomain(row as UnitModel);
  }

  async findUnitByUuid(tenantId: bigint, uuid: string): Promise<Unit | null> {
    const row = await prisma.unit.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toUnitDomain(row) : null;
  }

  async listUnitsByCompany(tenantId: bigint, companyUuid: string): Promise<Unit[]> {
    const rows = await prisma.unit.findMany({
      where: { tenantId, companyUuid, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return rows.map(toUnitDomain);
  }

  async listBaseUnits(tenantId: bigint, companyUuid: string): Promise<Unit[]> {
    const rows = await prisma.unit.findMany({
      where: { tenantId, companyUuid, baseUnitId: null, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return rows.map(toUnitDomain);
  }

  async findUnitByName(tenantId: bigint, companyUuid: string, name: string): Promise<Unit | null> {
    const row = await prisma.unit.findFirst({
      where: { tenantId, companyUuid, name, deletedAt: null },
    });
    return row ? toUnitDomain(row) : null;
  }

  async findUnitBySymbol(tenantId: bigint, companyUuid: string, symbol: string): Promise<Unit | null> {
    const row = await prisma.unit.findFirst({
      where: { tenantId, companyUuid, symbol, deletedAt: null },
    });
    return row ? toUnitDomain(row) : null;
  }

  // Product is tenant-owned (06_DATABASE_STANDARDS.md MT-001) — every query
  // below asserts `tenantId` explicitly and independently, never trusting a
  // previously-resolved row (MT-002, Ch.6.4's worked example). `id` is
  // never accepted from outside this file (PK-003) — mutations key on
  // `(tenantId, uuid)`. `productCategoryId`/`unitId` are real, in-module FKs
  // (inventory.prisma) — not validated for existence here (a future
  // Business-layer concern, mirroring Account's own handling of
  // `accountGroupId`/`parentAccountId`).

  async createProduct(tenantId: bigint, props: CreateProductProps, tx?: RepositoryTransaction): Promise<Product> {
    const row = await this.client(tx).product.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyUuid: props.companyUuid,
        productCode: props.productCode,
        name: props.name,
        description: props.description ?? null,
        productCategoryId: props.productCategoryId,
        unitId: props.unitId ?? null,
        isStocked: props.isStocked,
        status: props.status ? (props.status as unknown as PrismaProductStatus) : undefined,
        createdBy: props.createdBy ?? null,
      },
    });
    return toProductDomain(row);
  }

  async updateProduct(
    tenantId: bigint,
    uuid: string,
    props: UpdateProductProps,
    tx?: RepositoryTransaction,
  ): Promise<Product> {
    const client = this.client(tx);
    const { count } = await client.product.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        productCode: props.productCode,
        name: props.name,
        description: props.description,
        productCategoryId: props.productCategoryId,
        unitId: props.unitId,
        isStocked: props.isStocked,
        status: props.status ? (props.status as unknown as PrismaProductStatus) : undefined,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new ProductNotFoundError(uuid);
    }
    const row = await client.product.findFirst({ where: { tenantId, uuid } });
    return toProductDomain(row as ProductModel);
  }

  async findProductByUuid(tenantId: bigint, uuid: string): Promise<Product | null> {
    const row = await prisma.product.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toProductDomain(row) : null;
  }

  async listProductsByCompany(tenantId: bigint, companyUuid: string): Promise<Product[]> {
    const rows = await prisma.product.findMany({
      where: { tenantId, companyUuid, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return rows.map(toProductDomain);
  }

  async findProductByCode(tenantId: bigint, companyUuid: string, productCode: string): Promise<Product | null> {
    const row = await prisma.product.findFirst({
      where: { tenantId, companyUuid, productCode, deletedAt: null },
    });
    return row ? toProductDomain(row) : null;
  }

  async findProductByName(tenantId: bigint, companyUuid: string, name: string): Promise<Product | null> {
    const row = await prisma.product.findFirst({
      where: { tenantId, companyUuid, name, deletedAt: null },
    });
    return row ? toProductDomain(row) : null;
  }
}
