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
  Warehouse as WarehouseModel,
  Stock as StockModel,
  ProductStatus as PrismaProductStatus,
  WarehouseStatus as PrismaWarehouseStatus,
} from "../../../database/generated/client";
import {
  ProductCategory,
  CreateProductCategoryProps,
  UpdateProductCategoryProps,
} from "../domain/entities/product-category.entity";
import { Unit, CreateUnitProps, UpdateUnitProps } from "../domain/entities/unit.entity";
import { Product, CreateProductProps, UpdateProductProps } from "../domain/entities/product.entity";
import { Warehouse, CreateWarehouseProps, UpdateWarehouseProps } from "../domain/entities/warehouse.entity";
import { Stock, CreateStockProps, UpdateStockProps } from "../domain/entities/stock.entity";
import { ProductStatus } from "../domain/enums/product-status.enum";
import { WarehouseStatus } from "../domain/enums/warehouse-status.enum";
import {
  ProductCategoryNotFoundError,
  UnitNotFoundError,
  ProductNotFoundError,
  WarehouseNotFoundError,
  StockNotFoundError,
} from "../domain/errors/inventory.errors";
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

function toWarehouseDomain(row: WarehouseModel): Warehouse {
  return new Warehouse(
    row.id,
    row.uuid,
    row.tenantId,
    row.branchUuid,
    row.warehouseCode,
    row.name,
    row.description,
    row.status as unknown as WarehouseStatus,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

/// `.toFixed()` (not `.toString()`) guarantees plain fixed-point decimal
/// notation, never exponential notation, mirroring `toUnitDomain`'s own
/// `conversionFactor` mapping.
function toStockDomain(row: StockModel): Stock {
  return new Stock(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyUuid,
    row.warehouseUuid,
    row.productId,
    row.quantityOnHand.toFixed(),
    row.quantityReserved.toFixed(),
    row.quantityAvailable.toFixed(),
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

  // Warehouse is tenant-owned (06_DATABASE_STANDARDS.md MT-001) — every
  // query below asserts `tenantId` explicitly and independently, never
  // trusting a previously-resolved row (MT-002, Ch.6.4's worked example).
  // `id` is never accepted from outside this file (PK-003) — mutations key
  // on `(tenantId, uuid)`. `branchUuid` is a cross-module reference
  // (FK-002) — not validated for existence here (a future Business-layer
  // concern, mirroring Product's/Unit's own handling of `companyUuid`).

  async createWarehouse(tenantId: bigint, props: CreateWarehouseProps, tx?: RepositoryTransaction): Promise<Warehouse> {
    const row = await this.client(tx).warehouse.create({
      data: {
        uuid: newUuid(),
        tenantId,
        branchUuid: props.branchUuid,
        warehouseCode: props.warehouseCode,
        name: props.name,
        description: props.description ?? null,
        status: props.status ? (props.status as unknown as PrismaWarehouseStatus) : undefined,
        createdBy: props.createdBy ?? null,
      },
    });
    return toWarehouseDomain(row);
  }

  async updateWarehouse(
    tenantId: bigint,
    uuid: string,
    props: UpdateWarehouseProps,
    tx?: RepositoryTransaction,
  ): Promise<Warehouse> {
    const client = this.client(tx);
    const { count } = await client.warehouse.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        warehouseCode: props.warehouseCode,
        name: props.name,
        description: props.description,
        status: props.status ? (props.status as unknown as PrismaWarehouseStatus) : undefined,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new WarehouseNotFoundError(uuid);
    }
    const row = await client.warehouse.findFirst({ where: { tenantId, uuid } });
    return toWarehouseDomain(row as WarehouseModel);
  }

  async findWarehouseByUuid(tenantId: bigint, uuid: string): Promise<Warehouse | null> {
    const row = await prisma.warehouse.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toWarehouseDomain(row) : null;
  }

  async findWarehouseByCode(tenantId: bigint, branchUuid: string, warehouseCode: string): Promise<Warehouse | null> {
    const row = await prisma.warehouse.findFirst({
      where: { tenantId, branchUuid, warehouseCode, deletedAt: null },
    });
    return row ? toWarehouseDomain(row) : null;
  }

  async listWarehousesByBranch(tenantId: bigint, branchUuid: string): Promise<Warehouse[]> {
    const rows = await prisma.warehouse.findMany({
      where: { tenantId, branchUuid, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return rows.map(toWarehouseDomain);
  }

  async listWarehousesByTenant(tenantId: bigint): Promise<Warehouse[]> {
    const rows = await prisma.warehouse.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return rows.map(toWarehouseDomain);
  }

  // Stock is tenant-owned (06_DATABASE_STANDARDS.md MT-001) — every query
  // below asserts `tenantId` explicitly and independently, never trusting a
  // previously-resolved row (MT-002, Ch.6.4's worked example). `id` is
  // never accepted from outside this file (PK-003) — mutations key on
  // `(tenantId, uuid)`. `companyUuid`/`warehouseUuid` are uuid-reference
  // fields (FK-002) and `productId` is a real, in-module FK
  // (inventory.prisma) — none validated for existence here (a future
  // Business-layer concern, mirroring Warehouse's own handling of
  // `branchUuid`).

  async createStock(tenantId: bigint, props: CreateStockProps, tx?: RepositoryTransaction): Promise<Stock> {
    const row = await this.client(tx).stock.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyUuid: props.companyUuid,
        warehouseUuid: props.warehouseUuid,
        productId: props.productId,
        quantityOnHand: props.quantityOnHand ?? undefined,
        quantityReserved: props.quantityReserved ?? undefined,
        quantityAvailable: props.quantityAvailable ?? undefined,
        createdBy: props.createdBy ?? null,
      },
    });
    return toStockDomain(row);
  }

  async updateStock(tenantId: bigint, uuid: string, props: UpdateStockProps, tx?: RepositoryTransaction): Promise<Stock> {
    const client = this.client(tx);
    const { count } = await client.stock.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        quantityOnHand: props.quantityOnHand,
        quantityReserved: props.quantityReserved,
        quantityAvailable: props.quantityAvailable,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new StockNotFoundError(uuid);
    }
    const row = await client.stock.findFirst({ where: { tenantId, uuid } });
    return toStockDomain(row as StockModel);
  }

  async findStockByUuid(tenantId: bigint, uuid: string): Promise<Stock | null> {
    const row = await prisma.stock.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toStockDomain(row) : null;
  }

  async findStockByWarehouseAndProduct(tenantId: bigint, warehouseUuid: string, productId: bigint): Promise<Stock | null> {
    const row = await prisma.stock.findFirst({
      where: { tenantId, warehouseUuid, productId, deletedAt: null },
    });
    return row ? toStockDomain(row) : null;
  }

  async listStocksByWarehouse(tenantId: bigint, warehouseUuid: string): Promise<Stock[]> {
    const rows = await prisma.stock.findMany({
      where: { tenantId, warehouseUuid, deletedAt: null },
      orderBy: { id: "asc" },
    });
    return rows.map(toStockDomain);
  }

  async listStocksByCompany(tenantId: bigint, companyUuid: string): Promise<Stock[]> {
    const rows = await prisma.stock.findMany({
      where: { tenantId, companyUuid, deletedAt: null },
      orderBy: { id: "asc" },
    });
    return rows.map(toStockDomain);
  }
}
