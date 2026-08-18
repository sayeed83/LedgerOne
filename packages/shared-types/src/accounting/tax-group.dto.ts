// Mirrors presentation/dto/responses/tax-group.response.dto.ts. No
// lifecycle/delete — create/get/update/list only.
export interface TaxGroupResponseDto {
  uuid: string;
  companyUuid: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxGroupRequestDto {
  companyUuid: string;
  name: string;
}

export interface UpdateTaxGroupRequestDto {
  name?: string;
}
