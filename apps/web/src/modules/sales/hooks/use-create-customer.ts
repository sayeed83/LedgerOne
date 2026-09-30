import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateCustomerRequestDto, CustomerResponseDto } from "@ledgerone/shared-types";
import * as salesService from "@/services/sales.service";
import type { ApiError } from "@/services/api-client";
import { customersQueryKey, customersByCompanyQueryKey } from "./use-customers";

export function useCreateCustomer(companyUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<CustomerResponseDto, ApiError, CreateCustomerRequestDto>({
    mutationFn: (payload) => salesService.createCustomer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customersQueryKey() });
      queryClient.invalidateQueries({ queryKey: customersByCompanyQueryKey(companyUuid) });
    },
  });
}
