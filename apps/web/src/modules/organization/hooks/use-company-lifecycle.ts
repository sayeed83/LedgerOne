import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CompanyResponseDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";
import { companyQueryKey } from "./use-company";
import { companiesQueryKey } from "./use-companies";

// Ch.2.6 Company lifecycle: Draft/Closed -> Active, Active -> Closed.
function useLifecycleMutation(
  tenantUuid: string,
  companyUuid: string,
  action: (tenantUuid: string, companyUuid: string) => Promise<CompanyResponseDto>,
) {
  const queryClient = useQueryClient();
  return useMutation<CompanyResponseDto, ApiError, void>({
    mutationFn: () => action(tenantUuid, companyUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyQueryKey(companyUuid) });
      queryClient.invalidateQueries({ queryKey: companiesQueryKey(tenantUuid) });
    },
  });
}

export function useActivateCompany(tenantUuid: string, companyUuid: string) {
  return useLifecycleMutation(tenantUuid, companyUuid, organizationService.activateCompany);
}

export function useCloseCompany(tenantUuid: string, companyUuid: string) {
  return useLifecycleMutation(tenantUuid, companyUuid, organizationService.closeCompany);
}
