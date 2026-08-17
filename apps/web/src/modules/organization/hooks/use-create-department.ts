import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateDepartmentRequestDto, DepartmentResponseDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";
import { departmentsQueryKey } from "./use-departments";

export function useCreateDepartment(tenantUuid: string, companyUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<DepartmentResponseDto, ApiError, CreateDepartmentRequestDto>({
    mutationFn: (payload) => organizationService.createDepartment(tenantUuid, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: departmentsQueryKey(companyUuid) }),
  });
}
