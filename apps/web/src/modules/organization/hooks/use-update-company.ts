import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CompanyResponseDto, UpdateCompanyRequestDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";
import { companyQueryKey } from "./use-company";
import { companiesQueryKey } from "./use-companies";

export function useUpdateCompany(tenantUuid: string, companyUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<CompanyResponseDto, ApiError, UpdateCompanyRequestDto>({
    mutationFn: (payload) => organizationService.updateCompany(tenantUuid, companyUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey(companyUuid) });
      queryClient.invalidateQueries({ queryKey: companiesQueryKey(tenantUuid) });
    },
  });
}
