// Business layer — defines a new Product Category for a Company
// (00_BUSINESS_RULES.md Ch.35.1). No two (non-deleted) Product Categories
// may share the same name at the same hierarchy level — i.e. the same
// Company and the same parent Product Category, including two root-level
// Categories that both have no parent (Ch.35.8), checked here rather than
// left unenforced, mirroring create-account-group.service.ts's own
// duplicate-name check, scoped by parent rather than Company-wide since
// Ch.35.8 says "within its hierarchy level," not "within the Company."
// `companyUuid` is a cross-module reference (FK-002) to Organization's
// `companies.uuid`; its existence is not validated here, mirroring
// create-financial-year.service.ts's own `companyUuid` handling.
// `defaultTaxGroupUuid`, if supplied, is a cross-module reference (FK-002)
// to Accounting's `tax_groups.uuid` (Ch.35.3/PCT-002); its existence is
// likewise not validated here — this Business layer depends only on
// `IInventoryRepository`, never on another module's repository. If a
// `parentProductCategoryUuid` is supplied, it is resolved first (never
// trusting a client-supplied internal id, 06_DATABASE_STANDARDS.md PK-003).
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { ProductCategory } from "../domain/entities/product-category.entity";
import { ProductCategoryNotFoundError, DuplicateProductCategoryNameError } from "../domain/errors/inventory.errors";

export interface CreateProductCategoryInput {
  tenantId: bigint;
  companyUuid: string;
  name: string;
  parentProductCategoryUuid?: string;
  defaultTaxGroupUuid?: string | null;
  createdBy?: bigint | null;
}

export interface CreateProductCategoryDeps {
  repository: IInventoryRepository;
}

export async function createProductCategory(
  input: CreateProductCategoryInput,
  deps: CreateProductCategoryDeps,
): Promise<ProductCategory> {
  const { repository } = deps;

  let parentProductCategoryId: bigint | null = null;
  if (input.parentProductCategoryUuid) {
    const parentProductCategory = await repository.findProductCategoryByUuid(
      input.tenantId,
      input.parentProductCategoryUuid,
    );
    if (!parentProductCategory) {
      throw new ProductCategoryNotFoundError(input.parentProductCategoryUuid);
    }
    parentProductCategoryId = parentProductCategory.id;
  }

  const siblings = await repository.listProductCategories(input.tenantId, input.companyUuid);
  const duplicate = siblings.some(
    (category) => category.parentProductCategoryId === parentProductCategoryId && category.name === input.name,
  );
  if (duplicate) {
    throw new DuplicateProductCategoryNameError(input.companyUuid, input.name);
  }

  return repository.createProductCategory(input.tenantId, {
    companyUuid: input.companyUuid,
    name: input.name,
    parentProductCategoryId,
    defaultTaxGroupUuid: input.defaultTaxGroupUuid ?? null,
    createdBy: input.createdBy ?? null,
  });
}
