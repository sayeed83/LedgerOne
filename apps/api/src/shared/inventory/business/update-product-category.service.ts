// Business layer — revises a Product Category's name/parent/default Tax
// Group (00_BUSINESS_RULES.md Ch.35.5 — "static, low-change reference data,
// created and reorganized at Inventory Manager discretion"). Re-checks the
// same sibling-name-uniqueness rule `createProductCategory` enforces
// (Ch.35.8), excluding the row being updated itself, evaluated against the
// *effective* parent — the newly supplied one if given, otherwise the
// Category's own existing parent — mirroring
// update-account-group.service.ts's exclude-self duplicate check and its
// effective-value pattern for AGP-003.
//
// `parentProductCategoryUuid` distinguishes three input states: `undefined`
// (not supplied — leave the existing parent untouched, skip resolution
// entirely), `null` (explicitly clear the parent, moving the Category to
// root level), and a `string` (resolve to the new parent's internal id).
// Only `undefined` skips the resolve step. `defaultTaxGroupUuid` follows
// the same `undefined`-leaves-untouched / explicit-value-or-`null`-sets
// convention, passed straight through with no existence validation (a
// cross-module FK-002 reference into Accounting, never checked from this
// module).
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { ProductCategory } from "../domain/entities/product-category.entity";
import { ProductCategoryNotFoundError, DuplicateProductCategoryNameError } from "../domain/errors/inventory.errors";

export interface UpdateProductCategoryInput {
  tenantId: bigint;
  productCategoryUuid: string;
  name?: string;
  parentProductCategoryUuid?: string | null;
  defaultTaxGroupUuid?: string | null;
  updatedBy?: bigint | null;
}

export interface UpdateProductCategoryDeps {
  repository: IInventoryRepository;
}

export async function updateProductCategory(
  input: UpdateProductCategoryInput,
  deps: UpdateProductCategoryDeps,
): Promise<ProductCategory> {
  const { repository } = deps;

  const productCategory = await repository.findProductCategoryByUuid(input.tenantId, input.productCategoryUuid);
  if (!productCategory) {
    throw new ProductCategoryNotFoundError(input.productCategoryUuid);
  }

  let parentProductCategoryId: bigint | null | undefined;
  if (input.parentProductCategoryUuid === null) {
    parentProductCategoryId = null;
  } else if (input.parentProductCategoryUuid !== undefined) {
    const parentProductCategory = await repository.findProductCategoryByUuid(
      input.tenantId,
      input.parentProductCategoryUuid,
    );
    if (!parentProductCategory) {
      throw new ProductCategoryNotFoundError(input.parentProductCategoryUuid);
    }
    parentProductCategoryId = parentProductCategory.id;
  }

  const effectiveParentId =
    parentProductCategoryId !== undefined ? parentProductCategoryId : productCategory.parentProductCategoryId;
  const effectiveName = input.name ?? productCategory.name;

  // Re-check runs whenever either half of the (name, hierarchy level) pair
  // changes — not just on rename — since moving a Category to a new parent
  // without renaming it can equally create a same-level name collision
  // (Ch.35.8).
  const nameChanged = input.name !== undefined && input.name !== productCategory.name;
  const parentChanged = effectiveParentId !== productCategory.parentProductCategoryId;
  if (nameChanged || parentChanged) {
    const siblings = await repository.listProductCategories(input.tenantId, productCategory.companyUuid);
    const duplicate = siblings.some(
      (category) =>
        category.uuid !== productCategory.uuid &&
        category.parentProductCategoryId === effectiveParentId &&
        category.name === effectiveName,
    );
    if (duplicate) {
      throw new DuplicateProductCategoryNameError(productCategory.companyUuid, effectiveName);
    }
  }

  return repository.updateProductCategory(input.tenantId, productCategory.uuid, {
    name: input.name,
    parentProductCategoryId,
    defaultTaxGroupUuid: input.defaultTaxGroupUuid,
    updatedBy: input.updatedBy ?? null,
  });
}
