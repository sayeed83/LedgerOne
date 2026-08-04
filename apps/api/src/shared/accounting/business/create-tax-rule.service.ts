// Business layer — defines a new Tax Rule for a Tax Group
// (00_BUSINESS_RULES.md Ch.68.1). Resolves the parent Tax Group by its
// external `taxGroupUuid` first (mirroring create-fiscal-period.service.ts
// resolving its parent Financial Year) — this both satisfies "a Tax Rule
// belongs to exactly one Tax Group" and lets the Repository's internal
// `taxGroupId` FK be populated from the resolved row rather than trusted as
// a separately-supplied internal id (06_DATABASE_STANDARDS.md PK-003).
// Enforces every Ch.68.8 Validation Rule: the rate must be non-negative
// (Ch.68.8 — zero is explicitly valid per Ch.67.11's "Zero Rate" example,
// unlike Exchange Rate's stricter positive-only rule), the effective date
// range must be structurally valid (`effectiveTo` not before
// `effectiveFrom`, a documented Handbook Deviation — the minimum invariant
// a "range" implies, not explicit Ch.68 text), and the new range must not
// overlap an existing Tax Rule already registered for the same Tax Group
// (Ch.68.7 TXR-001 — "exactly one rule must be resolvable for any given
// transaction date"), checked here since MySQL has no declarative way to
// express a date-range overlap constraint
// (apps/api/src/database/schema/accounting.prisma). A `null`/omitted
// `effectiveTo` means open-ended (still in effect until superseded), so
// overlap comparison treats it as an unbounded upper end.
import { IAccountingRepository } from "../domain/interfaces/accounting-repository.interface";
import { TaxRule } from "../domain/entities/tax-rule.entity";
import { DecimalValue } from "../domain/value-objects/decimal-value.value-object";
import {
  TaxGroupNotFoundError,
  InvalidTaxRateValueError,
  InvalidTaxRuleEffectiveDateRangeError,
  TaxRuleOverlapError,
} from "../domain/errors/accounting.errors";

/** Represents an unbounded upper end for an open-ended (`effectiveTo: null`) Tax Rule during overlap comparison — never persisted. */
const OPEN_ENDED = new Date(8640000000000000);

export interface CreateTaxRuleInput {
  tenantId: bigint;
  taxGroupUuid: string;
  rate: DecimalValue;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  createdBy?: bigint | null;
}

export interface CreateTaxRuleDeps {
  repository: IAccountingRepository;
}

export async function createTaxRule(input: CreateTaxRuleInput, deps: CreateTaxRuleDeps): Promise<TaxRule> {
  const { repository } = deps;

  const taxGroup = await repository.findTaxGroupByUuid(input.tenantId, input.taxGroupUuid);
  if (!taxGroup) {
    throw new TaxGroupNotFoundError(input.taxGroupUuid);
  }

  if (input.rate.isNegative()) {
    throw new InvalidTaxRateValueError(input.rate.toString());
  }

  if (input.effectiveTo && input.effectiveTo < input.effectiveFrom) {
    throw new InvalidTaxRuleEffectiveDateRangeError(input.effectiveFrom, input.effectiveTo);
  }

  const newRangeEnd = input.effectiveTo ?? OPEN_ENDED;
  const existingRules = await repository.listTaxRules(input.tenantId, taxGroup.id);
  const overlaps = existingRules.some((rule) => {
    const existingRangeEnd = rule.effectiveTo ?? OPEN_ENDED;
    return input.effectiveFrom <= existingRangeEnd && newRangeEnd >= rule.effectiveFrom;
  });
  if (overlaps) {
    throw new TaxRuleOverlapError(taxGroup.uuid, input.effectiveFrom, input.effectiveTo ?? null);
  }

  return repository.createTaxRule(input.tenantId, {
    taxGroupId: taxGroup.id,
    rate: input.rate,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: input.effectiveTo ?? null,
    createdBy: input.createdBy ?? null,
  });
}
