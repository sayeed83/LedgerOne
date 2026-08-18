// Mirrors apps/api/src/shared/accounting/domain/enums/account-type.enum.ts —
// shared between Account Group and Account (Chart of Accounts).
export enum AccountType {
  Asset = "ASSET",
  Liability = "LIABILITY",
  Equity = "EQUITY",
  Revenue = "REVENUE",
  Expense = "EXPENSE",
}

// Mirrors presentation/dto/responses/account-group.response.dto.ts. Flagged
// known backend gap: the response does not echo back
// `parentAccountGroupUuid` — screens cannot render a group's own parent from
// this shape alone.
export interface AccountGroupResponseDto {
  uuid: string;
  companyUuid: string;
  name: string;
  accountType: AccountType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountGroupRequestDto {
  companyUuid: string;
  name: string;
  accountType: AccountType;
  parentAccountGroupUuid?: string | null;
}

export interface UpdateAccountGroupRequestDto {
  name?: string;
  accountType?: AccountType;
  parentAccountGroupUuid?: string | null;
}
