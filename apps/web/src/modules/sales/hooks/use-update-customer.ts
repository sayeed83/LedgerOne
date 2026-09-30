import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CustomerResponseDto, UpdateCustomerRequestDto } from "@ledgerone/shared-types";
import * as salesService from "@/services/sales.service";
import type { ApiError } from "@/services/api-client";
import { customerQueryKey } from "./use-customer";
import { customersQueryKey, customersByCompanyQueryKey } from "./use-customers";

export function useUpdateCustomer(companyUuid: string, customerUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<CustomerResponseDto, ApiError, UpdateCustomerRequestDto>({
    mutationFn: (payload) => salesService.updateCustomer(customerUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerQueryKey(customerUuid) });
      queryClient.invalidateQueries({ queryKey: customersQueryKey() });
      queryClient.invalidateQueries({ queryKey: customersByCompanyQueryKey(companyUuid) });
    },
  });
}
