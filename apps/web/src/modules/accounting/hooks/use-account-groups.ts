import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AccountGroupResponseDto,
  CreateAccountGroupRequestDto,
  UpdateAccountGroupRequestDto,
} from "@ledgerone/shared-types";
import * as accountingService from "@/services/accounting.service";
import type { ApiError } from "@/services/api-client";

export function accountGroupsQueryKey(companyUuid?: string) {
  return ["accounting", "account-groups", companyUuid ?? "all"] as const;
}

export function accountGroupQueryKey(accountGroupUuid: string) {
  return ["accounting", "account-group", accountGroupUuid] as const;
}

export function useAccountGroups(companyUuid: string | null) {
  return useQuery<AccountGroupResponseDto[], ApiError>({
    queryKey: accountGroupsQueryKey(companyUuid ?? undefined),
    queryFn: () => accountingService.listAccountGroups(companyUuid ?? undefined),
    enabled: Boolean(companyUuid),
  });
}

export function useAccountGroup(accountGroupUuid: string | null) {
  return useQuery<AccountGroupResponseDto, ApiError>({
    queryKey: accountGroupQueryKey(accountGroupUuid ?? ""),
    queryFn: () => accountingService.getAccountGroup(accountGroupUuid as string),
    enabled: Boolean(accountGroupUuid),
  });
}

export function useCreateAccountGroup(companyUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<AccountGroupResponseDto, ApiError, CreateAccountGroupRequestDto>({
    mutationFn: (payload) => accountingService.createAccountGroup(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountGroupsQueryKey(companyUuid) }),
  });
}

export function useUpdateAccountGroup(companyUuid: string, accountGroupUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<AccountGroupResponseDto, ApiError, UpdateAccountGroupRequestDto>({
    mutationFn: (payload) => accountingService.updateAccountGroup(accountGroupUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accountGroupQueryKey(accountGroupUuid) });
      queryClient.invalidateQueries({ queryKey: accountGroupsQueryKey(companyUuid) });
    },
  });
}
