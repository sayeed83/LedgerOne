// Shared test fixtures/fakes for Business-layer unit tests
// (05_CODING_STANDARDS.md Ch.10.6 — a unit test constructs a fake `deps`
// object directly, no mocking framework/container required). Not a
// `.service.ts` file itself, so it carries no use-case naming suffix.
import { ProductCategory } from "../../domain/entities/product-category.entity";
import { Unit } from "../../domain/entities/unit.entity";
import { Product } from "../../domain/entities/product.entity";
import { Warehouse } from "../../domain/entities/warehouse.entity";
import { Stock } from "../../domain/entities/stock.entity";
import { ProductStatus } from "../../domain/enums/product-status.enum";
import { WarehouseStatus } from "../../domain/enums/warehouse-status.enum";
import { IInventoryRepository } from "../../domain/interfaces/inventory-repository.interface";

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
  };
}
