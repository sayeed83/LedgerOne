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
  InventoryAdjustment as InventoryAdjustmentModel,
  StockMovement as StockMovementModel,
  Batch as BatchModel,
  ReorderLevel as ReorderLevelModel,
  ProductStatus as PrismaProductStatus,
  WarehouseStatus as PrismaWarehouseStatus,
  AdjustmentType as PrismaAdjustmentType,
  StockMovementType as PrismaStockMovementType,
  BatchStatus as PrismaBatchStatus,
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
import {
  InventoryAdjustment,
  CreateInventoryAdjustmentProps,
  UpdateInventoryAdjustmentProps,
} from "../domain/entities/inventory-adjustment.entity";
import { StockMovement, CreateStockMovementProps } from "../domain/entities/stock-movement.entity";
import { Batch, CreateBatchProps, UpdateBatchProps } from "../domain/entities/batch.entity";
import { ReorderLevel, CreateReorderLevelProps, UpdateReorderLevelProps } from "../domain/entities/reorder-level.entity";
import { ProductStatus } from "../domain/enums/product-status.enum";
import { WarehouseStatus } from "../domain/enums/warehouse-status.enum";
import { AdjustmentType } from "../domain/enums/adjustment-type.enum";
import { StockMovementType } from "../domain/enums/stock-movement-type.enum";
import { BatchStatus } from "../domain/enums/batch-status.enum";
import {
  ProductCategoryNotFoundError,
  UnitNotFoundError,
  ProductNotFoundError,
  WarehouseNotFoundError,
  StockNotFoundError,
  InventoryAdjustmentNotFoundError,
  BatchNotFoundError,
  ReorderLevelNotFoundError,
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

/// `.toFixed()` (not `.toString()`) guarantees plain fixed-point decimal
/// notation, never exponential notation, mirroring `toStockDomain`'s own
/// quantity mapping.
function toInventoryAdjustmentDomain(row: InventoryAdjustmentModel): InventoryAdjustment {
  return new InventoryAdjustment(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyUuid,
    row.warehouseUuid,
    row.productId,
    row.adjustmentType as unknown as AdjustmentType,
    row.quantity.toFixed(),
    row.reason,
    row.remarks,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

/// `.toFixed()` (not `.toString()`) guarantees plain fixed-point decimal
/// notation, never exponential notation, mirroring `toStockDomain`'s/
/// `toInventoryAdjustmentDomain`'s own quantity mapping.
function toStockMovementDomain(row: StockMovementModel): StockMovement {
  return new StockMovement(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyUuid,
    row.productId,
    row.sourceWarehouseUuid,
    row.destinationWarehouseUuid,
    row.movementType as unknown as StockMovementType,
    row.quantity.toFixed(),
    row.referenceType,
    row.referenceUuid,
    row.createdAt,
    row.createdBy,
  );
}

/// `.toFixed()` (not `.toString()`) guarantees plain fixed-point decimal
/// notation, never exponential notation, mirroring `toStockDomain`'s/
/// `toInventoryAdjustmentDomain`'s/`toStockMovementDomain`'s own quantity
/// mapping.
function toBatchDomain(row: BatchModel): Batch {
  return new Batch(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyUuid,
    row.productId,
    row.warehouseUuid,
    row.batchNumber,
    row.manufactureDate,
    row.expiryDate,
    row.quantity.toFixed(),
    row.status as unknown as BatchStatus,
    row.createdAt,
    row.updatedAt,
    row.createdBy,
    row.updatedBy,
    row.deletedAt,
  );
}

/// `.toFixed()` (not `.toString()`) guarantees plain fixed-point decimal
/// notation, never exponential notation, mirroring `toStockDomain`'s/
/// `toBatchDomain`'s own quantity mapping.
function toReorderLevelDomain(row: ReorderLevelModel): ReorderLevel {
  return new ReorderLevel(
    row.id,
    row.uuid,
    row.tenantId,
    row.companyUuid,
    row.warehouseUuid,
    row.productId,
    row.reorderLevel.toFixed(),
    row.reorderQuantity.toFixed(),
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

  // `applyStockQuantityDelta` (Ch.39.7 STM-001) — find-the-row-or-create-it-
  // at-zero, then apply a signed delta via Prisma's own atomic `increment`
  // (pushed down to a single `UPDATE ... SET quantity_on_hand =
  // quantity_on_hand + ?` at the database, race-free without any in-process
  // decimal arithmetic). Both the find and the write use `this.client(tx)`
  // (not the bare `prisma` singleton every read-only method above uses) so
  // they participate in the caller's transaction — required here, unlike
  // every other read in this file, because this method's own create-if-
  // missing branch must see writes made earlier in the same transaction.
  async applyStockQuantityDelta(
    tenantId: bigint,
    companyUuid: string,
    warehouseUuid: string,
    productId: bigint,
    quantityDelta: string,
    tx?: RepositoryTransaction,
  ): Promise<Stock> {
    const client = this.client(tx);
    const existing = await client.stock.findFirst({
      where: { tenantId, warehouseUuid, productId, deletedAt: null },
    });

    if (!existing) {
      const row = await client.stock.create({
        data: {
          uuid: newUuid(),
          tenantId,
          companyUuid,
          warehouseUuid,
          productId,
          quantityOnHand: quantityDelta,
          quantityReserved: "0",
          quantityAvailable: quantityDelta,
        },
      });
      return toStockDomain(row);
    }

    const row = await client.stock.update({
      where: { id: existing.id },
      data: {
        quantityOnHand: { increment: quantityDelta },
        quantityAvailable: { increment: quantityDelta },
      },
    });
    return toStockDomain(row);
  }

  // Inventory Adjustment is tenant-owned (06_DATABASE_STANDARDS.md MT-001) —
  // every query below asserts `tenantId` explicitly and independently, never
  // trusting a previously-resolved row (MT-002, Ch.6.4's worked example).
  // `id` is never accepted from outside this file (PK-003) — mutations key
  // on `(tenantId, uuid)`. `companyUuid`/`warehouseUuid` are uuid-reference
  // fields (FK-002) and `productId` is a real, in-module FK
  // (inventory.prisma) — none validated for existence here (a future
  // Business-layer concern, mirroring Stock's own handling of the identical
  // fields).

  async createInventoryAdjustment(
    tenantId: bigint,
    props: CreateInventoryAdjustmentProps,
    tx?: RepositoryTransaction,
  ): Promise<InventoryAdjustment> {
    const row = await this.client(tx).inventoryAdjustment.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyUuid: props.companyUuid,
        warehouseUuid: props.warehouseUuid,
        productId: props.productId,
        adjustmentType: props.adjustmentType as unknown as PrismaAdjustmentType,
        quantity: props.quantity,
        reason: props.reason,
        remarks: props.remarks ?? null,
        createdBy: props.createdBy ?? null,
      },
    });
    return toInventoryAdjustmentDomain(row);
  }

  async updateInventoryAdjustment(
    tenantId: bigint,
    uuid: string,
    props: UpdateInventoryAdjustmentProps,
    tx?: RepositoryTransaction,
  ): Promise<InventoryAdjustment> {
    const client = this.client(tx);
    const { count } = await client.inventoryAdjustment.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        adjustmentType: props.adjustmentType ? (props.adjustmentType as unknown as PrismaAdjustmentType) : undefined,
        quantity: props.quantity,
        reason: props.reason,
        remarks: props.remarks,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new InventoryAdjustmentNotFoundError(uuid);
    }
    const row = await client.inventoryAdjustment.findFirst({ where: { tenantId, uuid } });
    return toInventoryAdjustmentDomain(row as InventoryAdjustmentModel);
  }

  async findInventoryAdjustmentByUuid(tenantId: bigint, uuid: string): Promise<InventoryAdjustment | null> {
    const row = await prisma.inventoryAdjustment.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toInventoryAdjustmentDomain(row) : null;
  }

  async listInventoryAdjustmentsByWarehouse(tenantId: bigint, warehouseUuid: string): Promise<InventoryAdjustment[]> {
    const rows = await prisma.inventoryAdjustment.findMany({
      where: { tenantId, warehouseUuid, deletedAt: null },
      orderBy: { id: "asc" },
    });
    return rows.map(toInventoryAdjustmentDomain);
  }

  async listInventoryAdjustmentsByProduct(tenantId: bigint, productId: bigint): Promise<InventoryAdjustment[]> {
    const rows = await prisma.inventoryAdjustment.findMany({
      where: { tenantId, productId, deletedAt: null },
      orderBy: { id: "asc" },
    });
    return rows.map(toInventoryAdjustmentDomain);
  }

  async listInventoryAdjustmentsByCompany(tenantId: bigint, companyUuid: string): Promise<InventoryAdjustment[]> {
    const rows = await prisma.inventoryAdjustment.findMany({
      where: { tenantId, companyUuid, deletedAt: null },
      orderBy: { id: "asc" },
    });
    return rows.map(toInventoryAdjustmentDomain);
  }

  // Stock Movement (Ch.39) — persistence only. No `updateStockMovement`:
  // immutable once recorded (Ch.39.5/STM-002), mirroring `LedgerEntry`'s
  // append-only repository shape exactly (no `deletedAt` filter on reads
  // either, since no row is ever soft-deleted). `companyUuid` (FK-002) and
  // `productId` (real, in-module FK) are accepted as plain values with no
  // cross-repository existence validation, mirroring Stock's/Inventory
  // Adjustment's own identical treatment. `sourceWarehouseUuid`/
  // `destinationWarehouseUuid` (both FK-002) are likewise unvalidated here.

  async createStockMovement(
    tenantId: bigint,
    props: CreateStockMovementProps,
    tx?: RepositoryTransaction,
  ): Promise<StockMovement> {
    const row = await this.client(tx).stockMovement.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyUuid: props.companyUuid,
        productId: props.productId,
        sourceWarehouseUuid: props.sourceWarehouseUuid ?? null,
        destinationWarehouseUuid: props.destinationWarehouseUuid ?? null,
        movementType: props.movementType as unknown as PrismaStockMovementType,
        quantity: props.quantity,
        referenceType: props.referenceType ?? null,
        referenceUuid: props.referenceUuid ?? null,
        createdBy: props.createdBy ?? null,
      },
    });
    return toStockMovementDomain(row);
  }

  async findStockMovementByUuid(tenantId: bigint, uuid: string): Promise<StockMovement | null> {
    const row = await prisma.stockMovement.findFirst({
      where: { tenantId, uuid },
    });
    return row ? toStockMovementDomain(row) : null;
  }

  async listStockMovementsByWarehouse(tenantId: bigint, warehouseUuid: string): Promise<StockMovement[]> {
    const rows = await prisma.stockMovement.findMany({
      where: {
        tenantId,
        OR: [{ sourceWarehouseUuid: warehouseUuid }, { destinationWarehouseUuid: warehouseUuid }],
      },
      orderBy: { id: "asc" },
    });
    return rows.map(toStockMovementDomain);
  }

  async listStockMovementsByProduct(tenantId: bigint, productId: bigint): Promise<StockMovement[]> {
    const rows = await prisma.stockMovement.findMany({
      where: { tenantId, productId },
      orderBy: { id: "asc" },
    });
    return rows.map(toStockMovementDomain);
  }

  async listStockMovementsByCompany(tenantId: bigint, companyUuid: string): Promise<StockMovement[]> {
    const rows = await prisma.stockMovement.findMany({
      where: { tenantId, companyUuid },
      orderBy: { id: "asc" },
    });
    return rows.map(toStockMovementDomain);
  }

  // Batch (Ch.40) is tenant-owned (MT-001) — every query below asserts
  // `tenantId` explicitly. `companyUuid`/`warehouseUuid` (cross-module/
  // in-module uuid references, FK-002) and `productId` (real, in-module FK)
  // are accepted as plain values with no cross-repository existence
  // validation, mirroring Stock's/Inventory Adjustment's own identical
  // treatment. No BAT-001/BAT-002/BAT-003 enforcement, no
  // expiry-after-manufacture validation (Ch.40.8) — persistence only, all
  // Business-layer concerns for a later milestone.

  async createBatch(tenantId: bigint, props: CreateBatchProps, tx?: RepositoryTransaction): Promise<Batch> {
    const row = await this.client(tx).batch.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyUuid: props.companyUuid,
        productId: props.productId,
        warehouseUuid: props.warehouseUuid,
        batchNumber: props.batchNumber,
        manufactureDate: props.manufactureDate ?? null,
        expiryDate: props.expiryDate ?? null,
        quantity: props.quantity,
        status: props.status ? (props.status as unknown as PrismaBatchStatus) : undefined,
        createdBy: props.createdBy ?? null,
      },
    });
    return toBatchDomain(row);
  }

  async updateBatch(tenantId: bigint, uuid: string, props: UpdateBatchProps, tx?: RepositoryTransaction): Promise<Batch> {
    const client = this.client(tx);
    const { count } = await client.batch.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        batchNumber: props.batchNumber,
        manufactureDate: props.manufactureDate,
        expiryDate: props.expiryDate,
        quantity: props.quantity,
        status: props.status ? (props.status as unknown as PrismaBatchStatus) : undefined,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new BatchNotFoundError(uuid);
    }
    const row = await client.batch.findFirst({ where: { tenantId, uuid } });
    return toBatchDomain(row as BatchModel);
  }

  async findBatchByUuid(tenantId: bigint, uuid: string): Promise<Batch | null> {
    const row = await prisma.batch.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toBatchDomain(row) : null;
  }

  async listBatchesByProduct(tenantId: bigint, productId: bigint): Promise<Batch[]> {
    const rows = await prisma.batch.findMany({
      where: { tenantId, productId, deletedAt: null },
      orderBy: { id: "asc" },
    });
    return rows.map(toBatchDomain);
  }

  async listBatchesByWarehouse(tenantId: bigint, warehouseUuid: string): Promise<Batch[]> {
    const rows = await prisma.batch.findMany({
      where: { tenantId, warehouseUuid, deletedAt: null },
      orderBy: { id: "asc" },
    });
    return rows.map(toBatchDomain);
  }

  // Reorder Level (Ch.42) is tenant-owned (MT-001) — every query below
  // asserts `tenantId` explicitly. `companyUuid`/`warehouseUuid`
  // (cross-module/in-module uuid references, FK-002) and `productId` (real,
  // in-module FK) are accepted as plain values with no cross-repository
  // existence validation, mirroring Stock's own identical treatment. No
  // non-negative/positive validation (Ch.42.8), no reorder-alert generation
  // (ROL-102), and no Purchase Requisition suggestion — persistence only,
  // all Business-layer (or later-chapter) concerns for a future milestone.

  async createReorderLevel(
    tenantId: bigint,
    props: CreateReorderLevelProps,
    tx?: RepositoryTransaction,
  ): Promise<ReorderLevel> {
    const row = await this.client(tx).reorderLevel.create({
      data: {
        uuid: newUuid(),
        tenantId,
        companyUuid: props.companyUuid,
        warehouseUuid: props.warehouseUuid,
        productId: props.productId,
        reorderLevel: props.reorderLevel,
        reorderQuantity: props.reorderQuantity,
        createdBy: props.createdBy ?? null,
      },
    });
    return toReorderLevelDomain(row);
  }

  async updateReorderLevel(
    tenantId: bigint,
    uuid: string,
    props: UpdateReorderLevelProps,
    tx?: RepositoryTransaction,
  ): Promise<ReorderLevel> {
    const client = this.client(tx);
    const { count } = await client.reorderLevel.updateMany({
      where: { tenantId, uuid, deletedAt: null },
      data: {
        reorderLevel: props.reorderLevel,
        reorderQuantity: props.reorderQuantity,
        updatedBy: props.updatedBy ?? undefined,
      },
    });
    if (count === 0) {
      throw new ReorderLevelNotFoundError(uuid);
    }
    const row = await client.reorderLevel.findFirst({ where: { tenantId, uuid } });
    return toReorderLevelDomain(row as ReorderLevelModel);
  }

  async findReorderLevelByUuid(tenantId: bigint, uuid: string): Promise<ReorderLevel | null> {
    const row = await prisma.reorderLevel.findFirst({
      where: { tenantId, uuid, deletedAt: null },
    });
    return row ? toReorderLevelDomain(row) : null;
  }

  async findReorderLevelByWarehouseAndProduct(
    tenantId: bigint,
    warehouseUuid: string,
    productId: bigint,
  ): Promise<ReorderLevel | null> {
    const row = await prisma.reorderLevel.findFirst({
      where: { tenantId, warehouseUuid, productId, deletedAt: null },
    });
    return row ? toReorderLevelDomain(row) : null;
  }

  async listReorderLevelsByWarehouse(tenantId: bigint, warehouseUuid: string): Promise<ReorderLevel[]> {
    const rows = await prisma.reorderLevel.findMany({
      where: { tenantId, warehouseUuid, deletedAt: null },
      orderBy: { id: "asc" },
    });
    return rows.map(toReorderLevelDomain);
  }

  async listReorderLevelsByCompany(tenantId: bigint, companyUuid: string): Promise<ReorderLevel[]> {
    const rows = await prisma.reorderLevel.findMany({
      where: { tenantId, companyUuid, deletedAt: null },
      orderBy: { id: "asc" },
    });
    return rows.map(toReorderLevelDomain);
  }
}
