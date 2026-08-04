// Business layer — defines a new Tax Group for a Company
// (00_BUSINESS_RULES.md Ch.67.1). No two (non-deleted) Tax Groups may share
// the same name within a Company — checked here rather than left
// unenforced, since the Repository layer performs no duplicate checking of
// its own (Repository milestone's own scope: persistence only), mirroring
// create-currency.service.ts's identical ISO-code-duplicate check.
// `companyUuid` is a cross-module reference (FK-002) to Organization's
// `companies.uuid`; its existence is not validated here, mirroring
// create-financial-year.service.ts's own `companyUuid` handling.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { TaxGroup } from "../domain/entities/tax-group.entity";
import { DuplicateTaxGroupNameError } from "../domain/errors/accounting.errors";

export interface CreateTaxGroupInput {
  tenantId: bigint;
  companyUuid: string;
  name: string;
  createdBy?: bigint | null;
}

export interface CreateTaxGroupDeps {
  repository: IAccountingRepository;
}

export async function createTaxGroup(input: CreateTaxGroupInput, deps: CreateTaxGroupDeps): Promise<TaxGroup> {
  const { repository } = deps;

  const existingGroups = await repository.listTaxGroups(input.tenantId, input.companyUuid);
  const duplicate = existingGroups.some((group) => group.name === input.name);
  if (duplicate) {
    throw new DuplicateTaxGroupNameError(input.companyUuid, input.name);
  }

  return repository.createTaxGroup(input.tenantId, {
    companyUuid: input.companyUuid,
    name: input.name,
    createdBy: input.createdBy ?? null,
  });
}
