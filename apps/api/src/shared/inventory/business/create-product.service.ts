// Business layer — defines a new Product for a Company
// (00_BUSINESS_RULES.md Ch.34.1). PCT-001 ("every Product must be assigned
// to exactly one Product Category") is enforced by resolving
// `productCategoryUuid` first — never trusting a client-supplied internal
// id (06_DATABASE_STANDARDS.md PK-003) — throwing
// `ProductCategoryNotFoundError` if it doesn't exist. If a `unitUuid` is
// supplied, it is likewise resolved first, throwing `UnitNotFoundError` if
// it doesn't exist (Ch.34.8's Unit-of-Measure reference). PRD-001 ("every
// Product must have a unique identifying code within the Company") is
// enforced via `findProductByCode`, mirroring
// create-product-category.service.ts's own duplicate-name check pattern,
// using `DuplicateProductCodeError`.
//
// Deliberately NOT enforced here, per explicit instruction to implement
// only rules the PRD/architecture explicitly supports: whether a Unit is
// *required* for a Stocked Product (Ch.34.8) — that would need this same
// service to reject a Stocked Product with no Unit, which was not among
// the authorized rules for this milestone; PRD-003 ("cannot be
// Discontinued while it has non-zero Stock") and Ch.34.12 ("Stocked
// classification is fixed once transacted") — neither Stock (Ch.38) nor any
// transaction history exists yet in this codebase to evaluate them
// against. All three flagged, not silently invented, mirroring Unit's own
// UNT-002 deferral. `companyUuid` is a cross-module reference (FK-002) to
// Organization's `companies.uuid`; its existence is not validated here,
// mirroring every other Inventory create service's `companyUuid` handling.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Product } from "../domain/entities/product.entity";
import { ProductStatus } from "../domain/enums/product-status.enum";
import { ProductCategoryNotFoundError, UnitNotFoundError, DuplicateProductCodeError } from "../domain/errors/inventory.errors";

export interface CreateProductInput {
  tenantId: bigint;
  companyUuid: string;
  productCode: string;
  name: string;
  description?: string | null;
  productCategoryUuid: string;
  unitUuid?: string;
  isStocked: boolean;
  status?: ProductStatus;
  createdBy?: bigint | null;
}

export interface CreateProductDeps {
  repository: IInventoryRepository;
}

export async function createProduct(input: CreateProductInput, deps: CreateProductDeps): Promise<Product> {
  const { repository } = deps;

  const productCategory = await repository.findProductCategoryByUuid(input.tenantId, input.productCategoryUuid);
  if (!productCategory) {
    throw new ProductCategoryNotFoundError(input.productCategoryUuid);
  }

  let unitId: bigint | null = null;
  if (input.unitUuid) {
    const unit = await repository.findUnitByUuid(input.tenantId, input.unitUuid);
    if (!unit) {
      throw new UnitNotFoundError(input.unitUuid);
    }
    unitId = unit.id;
  }

  const existing = await repository.findProductByCode(input.tenantId, input.companyUuid, input.productCode);
  if (existing) {
    throw new DuplicateProductCodeError(input.companyUuid, input.productCode);
  }

  return repository.createProduct(input.tenantId, {
    companyUuid: input.companyUuid,
    productCode: input.productCode,
    name: input.name,
    description: input.description ?? null,
    productCategoryId: productCategory.id,
    unitId,
    isStocked: input.isStocked,
    status: input.status,
    createdBy: input.createdBy ?? null,
  });
}
