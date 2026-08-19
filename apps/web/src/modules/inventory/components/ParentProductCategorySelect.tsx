"use client";

import { Select } from "@ledgerone/ui";
import { useProductCategories } from "../hooks/use-product-categories";

export interface ParentProductCategorySelectProps {
  companyUuid: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  excludeUuid?: string;
}

// Mirrors BaseUnitSelect.tsx's exact pattern (its own closest analog: a
// self-referential, optional parent picker) — sources from the same
// `useProductCategories` list `ProductCategorySelect.tsx` already uses,
// excluding the Category currently being edited (`excludeUuid`) so a
// Category can never be assigned as its own parent (Ch.35.1/35.10).
export function ParentProductCategorySelect({
  companyUuid,
  value,
  onChange,
  label = "Parent Category (optional)",
  error,
  excludeUuid,
}: ParentProductCategorySelectProps) {
  const productCategoriesQuery = useProductCategories(companyUuid || null);
  const options = (productCategoriesQuery.data ?? [])
    .filter((category) => category.uuid !== excludeUuid)
    .map((category) => ({ value: category.uuid, label: category.name }));

  return (
    <Select
      label={label}
      placeholder={
        !companyUuid
          ? "Select a Company first"
          : productCategoriesQuery.isLoading
            ? "Loading product categories…"
            : "None"
      }
      options={options}
      value={value}
      error={error}
      disabled={!companyUuid}
      onChange={onChange}
    />
  );
}
