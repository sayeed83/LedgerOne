import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AccountResponseDto,
  CreateAccountRequestDto,
  ListAccountsQueryDto,
  UpdateAccountRequestDto,
} from "@ledgerone/shared-types";
import * as accountingService from "@/services/accounting.service";
import type { ApiError } from "@/services/api-client";

export function accountsQueryKey(query?: ListAccountsQueryDto) {
  return ["accounting", "accounts", query ?? {}] as const;
}

export function accountQueryKey(accountUuid: string) {
  return ["accounting", "account", accountUuid] as const;
}

export function useAccounts(query?: ListAccountsQueryDto) {
  return useQuery<AccountResponseDto[], ApiError>({
    queryKey: accountsQueryKey(query),
    queryFn: () => accountingService.listAccounts(query),
    enabled: Boolean(query?.companyUuid),
  });
}

export function useAccount(accountUuid: string | null) {
  return useQuery<AccountResponseDto, ApiError>({
    queryKey: accountQueryKey(accountUuid ?? ""),
    queryFn: () => accountingService.getAccount(accountUuid as string),
    enabled: Boolean(accountUuid),
  });
}

export function useCreateAccount(companyUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<AccountResponseDto, ApiError, CreateAccountRequestDto>({
    mutationFn: (payload) => accountingService.createAccount(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounting", "accounts", { companyUuid }] }),
  });
}

export function useUpdateAccount(companyUuid: string, accountUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<AccountResponseDto, ApiError, UpdateAccountRequestDto>({
    mutationFn: (payload) => accountingService.updateAccount(accountUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountQueryKey(accountUuid) });
      queryClient.invalidateQueries({ queryKey: ["accounting", "accounts", { companyUuid }] });
    },
  });
}

function useAccountTransition(
  companyUuid: string,
  accountUuid: string,
  action: (uuid: string) => Promise<AccountResponseDto>,
) {
  const queryClient = useQueryClient();
  return useMutation<AccountResponseDto, ApiError, void>({
    mutationFn: () => action(accountUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountQueryKey(accountUuid) });
      queryClient.invalidateQueries({ queryKey: ["accounting", "accounts", { companyUuid }] });
    },
  });
}

export function useActivateAccount(companyUuid: string, accountUuid: string) {
  return useAccountTransition(companyUuid, accountUuid, accountingService.activateAccount);
}

export function useDeactivateAccount(companyUuid: string, accountUuid: string) {
  return useAccountTransition(companyUuid, accountUuid, accountingService.deactivateAccount);
}
