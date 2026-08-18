import type { AccountType } from "./account-group.dto";

// Mirrors apps/api/src/shared/accounting/domain/enums/account-status.enum.ts.
export enum AccountStatus {
  Draft = "DRAFT",
  Active = "ACTIVE",
  Inactive = "INACTIVE",
}

// Chart of Accounts. Mirrors presentation/dto/responses/account.response.dto.ts.
export interface AccountResponseDto {
  uuid: string;
  companyUuid: string;
  code: string;
  name: string;
  accountType: AccountType;
  isPostingAccount: boolean;
  status: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountRequestDto {
  companyUuid: string;
  code: string;
  name: string;
  accountType: AccountType;
  accountGroupUuid: string;
  parentAccountUuid?: string | null;
  isPostingAccount?: boolean;
}

export interface UpdateAccountRequestDto {
  name?: string;
  accountGroupUuid?: string;
  parentAccountUuid?: string | null;
  isPostingAccount?: boolean;
}

export interface ListAccountsQueryDto {
  companyUuid?: string;
  accountGroupUuid?: string;
  status?: AccountStatus;
}
