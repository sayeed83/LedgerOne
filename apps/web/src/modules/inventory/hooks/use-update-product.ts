import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductResponseDto, UpdateProductRequestDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { productQueryKey } from "./use-product";
import { productsQueryKey } from "./use-products";

export function useUpdateProduct(companyUuid: string, productUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<ProductResponseDto, ApiError, UpdateProductRequestDto>({
    mutationFn: (payload) => inventoryService.updateProduct(productUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productQueryKey(productUuid) });
      queryClient.invalidateQueries({ queryKey: productsQueryKey(companyUuid) });
    },
  });
}
