// Mirrors apps/api/src/shared/inventory/presentation/dto/responses/unit.response.dto.ts
// and dto/requests/{create-unit.dto.ts,update-unit.dto.ts}. Flagged known
// backend gap (mirrors Account Group's own identical, already-documented
// gap): the response does not echo back `baseUnitUuid` — screens cannot
// render/prefill a Unit's own base Unit from this shape alone.
export interface UnitResponseDto {
  uuid: string;
  companyUuid: string;
  name: string;
  symbol: string;
  conversionFactor: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitRequestDto {
  companyUuid: string;
  name: string;
  symbol: string;
  baseUnitUuid?: string;
  conversionFactor?: string;
}

export interface UpdateUnitRequestDto {
  name?: string;
  symbol?: string;
  baseUnitUuid?: string | null;
  conversionFactor?: string | null;
}
