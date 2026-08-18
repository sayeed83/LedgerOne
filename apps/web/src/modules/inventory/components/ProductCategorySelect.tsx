"use client";

import { Select } from "@ledgerone/ui";
import { useProductCategories } from "../hooks/use-product-categories";

export interface ProductCategorySelectProps {
  companyUuid: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

// Mirrors BaseUnitSelect.tsx/AccountGroupSelect.tsx's exact pattern.
// Product Category has no create/edit/list frontend of its own yet — this
// selector exists only to let ProductForm assign a Product to an existing
// Product Category (PCT-001: every Product must have exactly one).
export function ProductCategorySelect({
  companyUuid,
  value,
  onChange,
  label = "Product Category",
  error,
}: ProductCategorySelectProps) {
  const productCategoriesQuery = useProductCategories(companyUuid || null);
  const options = (productCategoriesQuery.data ?? []).map((category) => ({
    value: category.uuid,
    label: category.name,
  }));

  return (
    <Select
      label={label}
      placeholder={
        !companyUuid
          ? "Select a Company first"
          : productCategoriesQuery.isLoading
            ? "Loading product categories…"
            : "Select a product category"
      }
      options={options}
      value={value}
      error={error}
      disabled={!companyUuid}
      onChange={onChange}
    />
  );
}
