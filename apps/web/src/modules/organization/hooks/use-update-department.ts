import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DepartmentResponseDto, UpdateDepartmentRequestDto } from "@ledgerone/shared-types";
import * as organizationService from "@/services/organization.service";
import type { ApiError } from "@/services/api-client";
import { departmentQueryKey } from "./use-department";
import { departmentsQueryKey } from "./use-departments";

// `companyUuid` is optional — see use-update-branch.ts's identical note;
// Department's response DTO likewise never carries its parent Company uuid.
export function useUpdateDepartment(tenantUuid: string, departmentUuid: string, companyUuid?: string) {
  const queryClient = useQueryClient();
  return useMutation<DepartmentResponseDto, ApiError, UpdateDepartmentRequestDto>({
    mutationFn: (payload) => organizationService.updateDepartment(tenantUuid, departmentUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKey(departmentUuid) });
      if (companyUuid) {
        queryClient.invalidateQueries({ queryKey: departmentsQueryKey(companyUuid) });
      }
    },
  });
}
