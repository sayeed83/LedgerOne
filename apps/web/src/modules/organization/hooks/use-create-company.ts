import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CompanyResponseDto, CreateCompanyRequestDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";
import { companiesQueryKey } from "./use-companies";

export function useCreateCompany(tenantUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<CompanyResponseDto, ApiError, CreateCompanyRequestDto>({
    mutationFn: (payload) => organizationService.createCompany(tenantUuid, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companiesQueryKey(tenantUuid) }),
  });
}
