// Business layer — revises a Tax Group's name (00_BUSINESS_RULES.md
// Ch.67.5 — "static, low-change reference data, updated primarily in
// response to regulatory change"). Re-checks the same duplicate-name rule
// `createTaxGroup` enforces, excluding the row being updated itself,
// mirroring update-financial-year.service.ts's exclude-self overlap check.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { TaxGroup } from "../domain/entities/tax-group.entity";
import { TaxGroupNotFoundError, DuplicateTaxGroupNameError } from "../domain/errors/accounting.errors";

export interface UpdateTaxGroupInput {
  tenantId: bigint;
  taxGroupUuid: string;
  name?: string;
  updatedBy?: bigint | null;
}

export interface UpdateTaxGroupDeps {
  repository: IAccountingRepository;
}

export async function updateTaxGroup(input: UpdateTaxGroupInput, deps: UpdateTaxGroupDeps): Promise<TaxGroup> {
  const { repository } = deps;

  const taxGroup = await repository.findTaxGroupByUuid(input.tenantId, input.taxGroupUuid);
  if (!taxGroup) {
    throw new TaxGroupNotFoundError(input.taxGroupUuid);
  }

  if (input.name && input.name !== taxGroup.name) {
    const existingGroups = await repository.listTaxGroups(input.tenantId, taxGroup.companyUuid);
    const duplicate = existingGroups.some((group) => group.uuid !== taxGroup.uuid && group.name === input.name);
    if (duplicate) {
      throw new DuplicateTaxGroupNameError(taxGroup.companyUuid, input.name);
    }
  }

  return repository.updateTaxGroup(input.tenantId, taxGroup.uuid, {
    name: input.name,
    updatedBy: input.updatedBy ?? null,
  });
}
