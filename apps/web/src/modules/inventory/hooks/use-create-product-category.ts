import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateProductCategoryRequestDto, ProductCategoryResponseDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { productCategoriesQueryKey } from "./use-product-categories";

export function useCreateProductCategory(companyUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<ProductCategoryResponseDto, ApiError, CreateProductCategoryRequestDto>({
    mutationFn: (payload) => inventoryService.createProductCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productCategoriesQueryKey(companyUuid) });
    },
  });
}
