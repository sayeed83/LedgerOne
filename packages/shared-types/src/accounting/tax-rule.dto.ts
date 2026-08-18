// Mirrors presentation/dto/responses/tax-rule.response.dto.ts. Immutable —
// create/get/list only, no PUT/DELETE. Flagged known backend gap: the
// response does not echo back `taxGroupUuid` — screens keep the parent Tax
// Group's uuid in the route rather than reading it off the entity itself.
export interface TaxRuleResponseDto {
  uuid: string;
  rate: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxRuleRequestDto {
  taxGroupUuid: string;
  rate: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
}
