"use client";

import { Select } from "@ledgerone/ui";
import { useProducts } from "../hooks/use-products";

export interface ProductSelectProps {
  companyUuid: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
}

// Mirrors ProductCategorySelect.tsx's/UnitSelect.tsx's exact pattern — a
// read-only, Company-scoped picker reusing the existing Product API
// (`useProducts`/`listProductsByCompany`), no Product CRUD of its own.
//
// FLAGGED BACKEND LIMITATION (see stock.dto.ts's own header comment): this
// selector's `value`/`onChange` necessarily operate on a Product's `uuid` —
// the only identifier `ProductResponseDto` exposes (06_DATABASE_STANDARDS.md
// PK-003 — internal ids are never serialized over the API). But Stock's own
// `productId` field (create-stock.dto.ts/update-stock.dto.ts on the
// backend) is that very internal id, carried over verbatim from the
// Business layer's `CreateStockInput`/`UpdateStockInput` contract — there is
// no backend endpoint that resolves a Product `uuid` to its internal
// `productId`. This selector therefore CANNOT be wired directly to
// `StockForm`'s submitted `productId` field; `StockForm` uses it only as a
// "look up a Product by name/code" aid (to help an operator find the
// numeric Product ID they already know, e.g. from a support/admin tool),
// never as the field's actual value source. Fixing this for real requires a
// backend change (either exposing a `productUuid`-to-`productId` lookup, or
// changing Stock's own contract to use `productUuid` like every other
// Inventory cross-entity reference) — out of scope for this Frontend-only
// milestone.
export function ProductSelect({ companyUuid, value, onChange, label = "Look up Product", error }: ProductSelectProps) {
  const productsQuery = useProducts(companyUuid || null);
  const options = (productsQuery.data ?? []).map((product) => ({
    value: product.uuid,
    label: `${product.productCode} — ${product.name}`,
  }));

  return (
    <Select
      label={label}
      placeholder={
        !companyUuid ? "Select a Company first" : productsQuery.isLoading ? "Loading products…" : "Select a product"
      }
      options={options}
      value={value}
      error={error}
      disabled={!companyUuid}
      onChange={onChange}
    />
  );
}
