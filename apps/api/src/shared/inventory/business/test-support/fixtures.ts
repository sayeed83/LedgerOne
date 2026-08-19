// Shared test fixtures/fakes for Business-layer unit tests
// (05_CODING_STANDARDS.md Ch.10.6 — a unit test constructs a fake `deps`
// object directly, no mocking framework/container required). Not a
// `.service.ts` file itself, so it carries no use-case naming suffix.
import { ProductCategory } from "../../domain/entities/product-category.entity";
import { Unit } from "../../domain/entities/unit.entity";
import { Product } from "../../domain/entities/product.entity";
import { Warehouse } from "../../domain/entities/warehouse.entity";
import { Stock } from "../../domain/entities/stock.entity";
import { InventoryAdjustment } from "../../domain/entities/inventory-adjustment.entity";
import { StockMovement } from "../../domain/entities/stock-movement.entity";
import { Batch } from "../../domain/entities/batch.entity";
import { ReorderLevel } from "../../domain/entities/reorder-level.entity";
import { ProductStatus } from "../../domain/enums/product-status.enum";
import { WarehouseStatus } from "../../domain/enums/warehouse-status.enum";
import { AdjustmentType } from "../../domain/enums/adjustment-type.enum";
import { StockMovementType } from "../../domain/enums/stock-movement-type.enum";
import { BatchStatus } from "../../domain/enums/batch-status.enum";
import { IInventoryRepository } from "../../domain/interfaces/inventory-repository.interface";
import { ITransactionRunner } from "../../domain/interfaces/transaction-runner.interface";

export function buildProductCategory(overrides: Partial<ProductCategory> = {}): ProductCategory {
  const base = new ProductCategory(
    1n,
    "00000000-0000-0000-0000-000000000001",
    1n,
    "00000000-0000-0000-0000-000000000100",
    "Hardware",
    null,
    null,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(ProductCategory.prototype), base, overrides) as ProductCategory;
}

export function buildUnit(overrides: Partial<Unit> = {}): Unit {
  const base = new Unit(
    1n,
    "00000000-0000-0000-0000-000000000002",
    1n,
    "00000000-0000-0000-0000-000000000100",
    "Pieces",
    "Pcs",
    null,
    null,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(Unit.prototype), base, overrides) as Unit;
}

export function buildProduct(overrides: Partial<Product> = {}): Product {
  const base = new Product(
    1n,
    "00000000-0000-0000-0000-000000000003",
    1n,
    "00000000-0000-0000-0000-000000000100",
    "SB-M8-40",
    "Steel Bolt M8x40",
    null,
    1n,
    null,
    true,
    ProductStatus.Draft,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(Product.prototype), base, overrides) as Product;
}

export function buildWarehouse(overrides: Partial<Warehouse> = {}): Warehouse {
  const base = new Warehouse(
    1n,
    "00000000-0000-0000-0000-000000000004",
    1n,
    "00000000-0000-0000-0000-000000000200",
    "WH-001",
    "Head Office Warehouse",
    null,
    WarehouseStatus.Active,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(Warehouse.prototype), base, overrides) as Warehouse;
}

export function buildStock(overrides: Partial<Stock> = {}): Stock {
  const base = new Stock(
    1n,
    "00000000-0000-0000-0000-000000000005",
    1n,
    "00000000-0000-0000-0000-000000000100",
    "00000000-0000-0000-0000-000000000200",
    1n,
    "0.000000",
    "0.000000",
    "0.000000",
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(Stock.prototype), base, overrides) as Stock;
}

export function buildInventoryAdjustment(overrides: Partial<InventoryAdjustment> = {}): InventoryAdjustment {
  const base = new InventoryAdjustment(
    1n,
    "00000000-0000-0000-0000-000000000006",
    1n,
    "00000000-0000-0000-0000-000000000100",
    "00000000-0000-0000-0000-000000000200",
    1n,
    AdjustmentType.Increase,
    "1.000000",
    "Physical count variance",
    null,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(InventoryAdjustment.prototype), base, overrides) as InventoryAdjustment;
}

export function buildStockMovement(overrides: Partial<StockMovement> = {}): StockMovement {
  const base = new StockMovement(
    1n,
    "00000000-0000-0000-0000-000000000007",
    1n,
    "00000000-0000-0000-0000-000000000100",
    1n,
    "00000000-0000-0000-0000-000000000200",
    null,
    StockMovementType.Receipt,
    "1.000000",
    null,
    null,
    new Date("2026-01-01T00:00:00.000Z"),
    null,
  );
  return Object.assign(Object.create(StockMovement.prototype), base, overrides) as StockMovement;
}

export function buildBatch(overrides: Partial<Batch> = {}): Batch {
  const base = new Batch(
    1n,
    "00000000-0000-0000-0000-000000000008",
    1n,
    "00000000-0000-0000-0000-000000000100",
    1n,
    "00000000-0000-0000-0000-000000000200",
    "B2027-03",
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    "0.000000",
    BatchStatus.Active,
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(Batch.prototype), base, overrides) as Batch;
}

export function buildReorderLevel(overrides: Partial<ReorderLevel> = {}): ReorderLevel {
  const base = new ReorderLevel(
    1n,
    "00000000-0000-0000-0000-000000000009",
    1n,
    "00000000-0000-0000-0000-000000000100",
    "00000000-0000-0000-0000-000000000200",
    1n,
    "100.000000",
    "500.000000",
    new Date("2026-01-01T00:00:00.000Z"),
    new Date("2026-01-01T00:00:00.000Z"),
    null,
    null,
    null,
  );
  return Object.assign(Object.create(ReorderLevel.prototype), base, overrides) as ReorderLevel;
}

export function createFakeInventoryRepository(): jest.Mocked<IInventoryRepository> {
  return {
    createProductCategory: jest.fn(),
    findProductCategoryByUuid: jest.fn(),
    listProductCategories: jest.fn(),
    updateProductCategory: jest.fn(),
    createUnit: jest.fn(),
    updateUnit: jest.fn(),
    findUnitByUuid: jest.fn(),
    listUnitsByCompany: jest.fn(),
    listBaseUnits: jest.fn(),
    findUnitByName: jest.fn(),
    findUnitBySymbol: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    findProductByUuid: jest.fn(),
    listProductsByCompany: jest.fn(),
    findProductByCode: jest.fn(),
    findProductByName: jest.fn(),
    createWarehouse: jest.fn(),
    updateWarehouse: jest.fn(),
    findWarehouseByUuid: jest.fn(),
    findWarehouseByCode: jest.fn(),
    listWarehousesByBranch: jest.fn(),
    listWarehousesByTenant: jest.fn(),
    createStock: jest.fn(),
    updateStock: jest.fn(),
    findStockByUuid: jest.fn(),
    findStockByWarehouseAndProduct: jest.fn(),
    listStocksByWarehouse: jest.fn(),
    listStocksByCompany: jest.fn(),
    applyStockQuantityDelta: jest.fn(),
    createInventoryAdjustment: jest.fn(),
    updateInventoryAdjustment: jest.fn(),
    findInventoryAdjustmentByUuid: jest.fn(),
    listInventoryAdjustmentsByWarehouse: jest.fn(),
    listInventoryAdjustmentsByProduct: jest.fn(),
    listInventoryAdjustmentsByCompany: jest.fn(),
    createStockMovement: jest.fn(),
    findStockMovementByUuid: jest.fn(),
    listStockMovementsByWarehouse: jest.fn(),
    listStockMovementsByProduct: jest.fn(),
    listStockMovementsByCompany: jest.fn(),
    createBatch: jest.fn(),
    updateBatch: jest.fn(),
    findBatchByUuid: jest.fn(),
    listBatchesByProduct: jest.fn(),
    listBatchesByWarehouse: jest.fn(),
    createReorderLevel: jest.fn(),
    updateReorderLevel: jest.fn(),
    findReorderLevelByUuid: jest.fn(),
    findReorderLevelByWarehouseAndProduct: jest.fn(),
    listReorderLevelsByWarehouse: jest.fn(),
    listReorderLevelsByCompany: jest.fn(),
  };
}

/** Runs `fn` immediately against a sentinel `tx` value — no real Prisma transaction in unit tests (05_CODING_STANDARDS.md Ch.10.6), mirroring Accounting's own `createFakeTransactionRunner` exactly. */
export function createFakeTransactionRunner(): jest.Mocked<ITransactionRunner> {
  return {
    run: jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn("fake-tx")),
  } as unknown as jest.Mocked<ITransactionRunner>;
}
