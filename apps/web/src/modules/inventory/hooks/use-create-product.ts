import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateProductRequestDto, ProductResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { productsQueryKey } from "./use-products";

export function useCreateProduct(companyUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<ProductResponseDto, ApiError, CreateProductRequestDto>({
    mutationFn: (payload) => inventoryService.createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsQueryKey(companyUuid) });
    },
  });
}
