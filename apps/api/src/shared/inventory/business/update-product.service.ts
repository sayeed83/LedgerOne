// Business layer — revises a Product's code/name/description/Product
// Category/Unit/Stocked flag/status (00_BUSINESS_RULES.md Ch.34.5). Re-runs
// the same PCT-001 Product-Category-must-exist check and Ch.34.8
// Unit-must-exist (when supplied) check `createProduct` enforces, and
// re-checks PRD-001's code-uniqueness rule whenever `productCode` is
// actually changing — mirroring update-product-category.service.ts's own
// "only re-check when the relevant field changes" pattern.
//
// `productCategoryUuid` is `string | undefined` only (never `null`) since
// PCT-001 requires exactly one Product Category at all times — there is no
// "clear it" state, unlike `unitUuid`. `unitUuid` distinguishes three input
// states: `undefined` (not supplied — leave the existing Unit untouched,
// skip resolution entirely), `null` (explicitly clear the Unit), and a
// `string` (resolve to the new Unit's internal id, throwing
// `UnitNotFoundError` if it doesn't exist) — mirroring
// update-unit.service.ts's own `baseUnitUuid` convention.
// `description`/`isStocked`/`status` are plain passthrough fields (Prisma's
// `undefined`-leaves-untouched convention).
//
// Deliberately NOT enforced here, per explicit instruction to implement
// only rules the PRD/architecture explicitly supports: PRD-003 ("cannot be
// Discontinued while it has non-zero Stock") and Ch.34.12 ("Stocked
// classification is fixed once transacted") — neither Stock (Ch.38) nor any
// transaction history exists yet in this codebase to evaluate them
// against; `status`/`isStocked` are therefore accepted and passed straight
// through with no transition/immutability validation, flagged rather than
// silently invented, mirroring Unit's own UNT-002 deferral.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Product } from "../domain/entities/product.entity";
import { ProductStatus } from "../domain/enums/product-status.enum";
import {
  ProductNotFoundError,
  ProductCategoryNotFoundError,
  UnitNotFoundError,
  DuplicateProductCodeError,
} from "../domain/errors/inventory.errors";

export interface UpdateProductInput {
  tenantId: bigint;
  productUuid: string;
  productCode?: string;
  name?: string;
  description?: string | null;
  productCategoryUuid?: string;
  unitUuid?: string | null;
  isStocked?: boolean;
  status?: ProductStatus;
  updatedBy?: bigint | null;
}

export interface UpdateProductDeps {
  repository: IInventoryRepository;
}

export async function updateProduct(input: UpdateProductInput, deps: UpdateProductDeps): Promise<Product> {
  const { repository } = deps;

  const product = await repository.findProductByUuid(input.tenantId, input.productUuid);
  if (!product) {
    throw new ProductNotFoundError(input.productUuid);
  }

  let productCategoryId: bigint | undefined;
  if (input.productCategoryUuid !== undefined) {
    const productCategory = await repository.findProductCategoryByUuid(input.tenantId, input.productCategoryUuid);
    if (!productCategory) {
      throw new ProductCategoryNotFoundError(input.productCategoryUuid);
    }
    productCategoryId = productCategory.id;
  }

  let unitId: bigint | null | undefined;
  if (input.unitUuid === null) {
    unitId = null;
  } else if (input.unitUuid !== undefined) {
    const unit = await repository.findUnitByUuid(input.tenantId, input.unitUuid);
    if (!unit) {
      throw new UnitNotFoundError(input.unitUuid);
    }
    unitId = unit.id;
  }

  if (input.productCode !== undefined && input.productCode !== product.productCode) {
    const existing = await repository.findProductByCode(input.tenantId, product.companyUuid, input.productCode);
    if (existing) {
      throw new DuplicateProductCodeError(product.companyUuid, input.productCode);
    }
  }

  return repository.updateProduct(input.tenantId, product.uuid, {
    productCode: input.productCode,
    name: input.name,
    description: input.description,
    productCategoryId,
    unitId,
    isStocked: input.isStocked,
    status: input.status,
    updatedBy: input.updatedBy ?? null,
  });
}
