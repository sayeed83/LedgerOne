import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductCategoryResponseDto, UpdateProductCategoryRequestDto } from "@ledgerone/shared-types";
import * as inventoryService from "@/services/inventory.service";
import type { ApiError } from "@/services/api-client";
import { productCategoryQueryKey } from "./use-product-category";
import { productCategoriesQueryKey } from "./use-product-categories";

export function useUpdateProductCategory(companyUuid: string, productCategoryUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<ProductCategoryResponseDto, ApiError, UpdateProductCategoryRequestDto>({
    mutationFn: (payload) => inventoryService.updateProductCategory(productCategoryUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productCategoryQueryKey(productCategoryUuid) });
      queryClient.invalidateQueries({ queryKey: productCategoriesQueryKey(companyUuid) });
    },
  });
}
