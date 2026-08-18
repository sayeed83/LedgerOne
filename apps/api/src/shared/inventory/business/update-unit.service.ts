// Business layer — revises a Unit's name/symbol/base Unit/conversion
// factor (00_BUSINESS_RULES.md Ch.36.5 — "static reference data ... with
// Company-specific custom units as needed", revised only as those custom
// units are corrected). Re-enforces the same Ch.36.8 positive-number rule
// `createUnit` enforces whenever a `conversionFactor` is supplied.
//
// `baseUnitUuid` distinguishes three input states: `undefined` (not
// supplied — leave the existing base Unit untouched, skip resolution
// entirely), `null` (explicitly clear the base Unit — this row becomes a
// base Unit itself), and a `string` (resolve to the new base Unit's
// internal id, throwing `UnitNotFoundError` if it doesn't exist). Only
// `undefined` skips the resolve step — mirroring
// update-product-category.service.ts's identical
// `parentProductCategoryUuid` convention. `conversionFactor` follows the
// same `undefined`-leaves-untouched / explicit-value-or-`null`-clears
// convention.
//
// No duplicate-name/duplicate-symbol re-check is enforced here, for the
// same reason `create-unit.service.ts` enforces none: Ch.36 defines no
// such rule (see that file's own header comment for the full reasoning).
import { IInventoryRepository } from "../domain/interfaces/inventory-repository.interface";
import { Unit } from "../domain/entities/unit.entity";
import { UnitNotFoundError, InvalidUnitConversionFactorValueError } from "../domain/errors/inventory.errors";

/** Ch.36.8: "Conversion factor must be a positive number." No leading '-', not zero. */
function isPositiveDecimalString(value: string): boolean {
  return /^\d+(\.\d+)?$/.test(value) && !/^0(\.0+)?$/.test(value);
}

export interface UpdateUnitInput {
  tenantId: bigint;
  unitUuid: string;
  name?: string;
  symbol?: string;
  baseUnitUuid?: string | null;
  conversionFactor?: string | null;
  updatedBy?: bigint | null;
}

export interface UpdateUnitDeps {
  repository: IInventoryRepository;
}

export async function updateUnit(input: UpdateUnitInput, deps: UpdateUnitDeps): Promise<Unit> {
  const { repository } = deps;

  const unit = await repository.findUnitByUuid(input.tenantId, input.unitUuid);
  if (!unit) {
    throw new UnitNotFoundError(input.unitUuid);
  }

  let baseUnitId: bigint | null | undefined;
  if (input.baseUnitUuid === null) {
    baseUnitId = null;
  } else if (input.baseUnitUuid !== undefined) {
    const baseUnit = await repository.findUnitByUuid(input.tenantId, input.baseUnitUuid);
    if (!baseUnit) {
      throw new UnitNotFoundError(input.baseUnitUuid);
    }
    baseUnitId = baseUnit.id;
  }

  if (input.conversionFactor !== undefined && input.conversionFactor !== null && !isPositiveDecimalString(input.conversionFactor)) {
    throw new InvalidUnitConversionFactorValueError(input.conversionFactor);
  }

  return repository.updateUnit(input.tenantId, unit.uuid, {
    name: input.name,
    symbol: input.symbol,
    baseUnitId,
    conversionFactor: input.conversionFactor,
    updatedBy: input.updatedBy ?? null,
  });
}
