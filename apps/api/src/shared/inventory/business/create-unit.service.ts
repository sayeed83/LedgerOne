// Business layer — defines a new Unit of Measure for a Company
// (00_BUSINESS_RULES.md Ch.36.1). `companyUuid` is a cross-module reference
// (FK-002) to Organization's `companies.uuid`; its existence is not
// validated here, mirroring create-product-category.service.ts's own
// `companyUuid` handling. If a `baseUnitUuid` is supplied, it is resolved
// first (never trusting a client-supplied internal id,
// 06_DATABASE_STANDARDS.md PK-003), throwing `UnitNotFoundError` if it
// doesn't exist. If a `conversionFactor` is supplied, it must be a positive
// number (Ch.36.8's explicit Validation Rule) — enforced here via
// `InvalidUnitConversionFactorValueError`.
//
// No duplicate-name/duplicate-symbol check is enforced here: unlike
// Product Category's Ch.35.8 ("must be unique within its hierarchy
// level"), Ch.36 states no name/symbol uniqueness rule for Unit at all —
// per explicit instruction, this milestone enforces only rules the
// handbook actually defines, not the "partial DB constraint implies a
// Business-layer check" pattern Account Group/Tax Group followed for their
// own (likewise handbook-silent) duplicate-name protection. Flagged
// consequence: `uq_units_tenant_company_name_deleted_at` (added at the
// Database milestone) will surface as a raw, untyped Prisma unique-
// constraint violation if a duplicate name is attempted through this
// service — a known, explicitly flagged gap, not a silent omission.
//
// Ch.36.7 UNT-002 ("a conversion factor must be defined before that
// alternate Unit can be used in a transaction for that Product") is a
// rule about Sales/Purchase Order line-item usage, a not-yet-built
// module's concern — not a Unit-creation-time validation, and therefore
// not enforced here.
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Unit } from "../domain/entities/unit.entity";
import { UnitNotFoundError, InvalidUnitConversionFactorValueError } from "../domain/errors/inventory.errors";

/** Ch.36.8: "Conversion factor must be a positive number." No leading '-', not zero. */
function isPositiveDecimalString(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value) && !/^0(\.0+)?$/.test(value);
}

export interface CreateUnitInput {
  tenantId: bigint;
  companyUuid: string;
  name: string;
  symbol: string;
  baseUnitUuid?: string;
  conversionFactor?: string;
  createdBy?: bigint | null;
}

export interface CreateUnitDeps {
  repository: IInventoryRepository;
}

export async function createUnit(input: CreateUnitInput, deps: CreateUnitDeps): Promise<Unit> {
  const { repository } = deps;

  let baseUnitId: bigint | null = null;
  if (input.baseUnitUuid) {
    const baseUnit = await repository.findUnitByUuid(input.tenantId, input.baseUnitUuid);
    if (!baseUnit) {
      throw new UnitNotFoundError(input.baseUnitUuid);
    }
    baseUnitId = baseUnit.id;
  }

  if (input.conversionFactor !== undefined && !isPositiveDecimalString(input.conversionFactor)) {
    throw new InvalidUnitConversionFactorValueError(input.conversionFactor);
  }

  return repository.createUnit(input.tenantId, {
    companyUuid: input.companyUuid,
    name: input.name,
    symbol: input.symbol,
    baseUnitId,
    conversionFactor: input.conversionFactor ?? null,
    createdBy: input.createdBy ?? null,
  });
}
