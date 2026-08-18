"use client";

import { Select } from "@ledgerone/ui";
import { useWarehouses } from "../hooks/use-warehouses";

export interface WarehouseSelectProps {
  branchUuid: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
}

// Mirrors UnitSelect.tsx's exact pattern, scoped by `branchUuid` rather than
// `companyUuid` — Warehouse's real parent is Branch, not Company
// (WHS-001/Ch.37.9), so this selector is scoped the same way
// `WarehouseListScreen`'s own Branch-scoped Warehouse fetch already is, not
// a new scoping convention. Read-only — no Warehouse create/edit affordance
// here (Warehouse CRUD already exists at `/inventory/warehouses`).
export function WarehouseSelect({
  branchUuid,
  value,
  onChange,
  label = "Warehouse",
  error,
  disabled = false,
}: WarehouseSelectProps) {
  const warehousesQuery = useWarehouses(branchUuid || null);
  const options = (warehousesQuery.data ?? []).map((warehouse) => ({
    value: warehouse.uuid,
    label: `${warehouse.warehouseCode} — ${warehouse.name}`,
  }));

  return (
    <Select
      label={label}
      placeholder={
        !branchUuid ? "Select a Branch first" : warehousesQuery.isLoading ? "Loading warehouses…" : "Select a warehouse"
      }
      options={options}
      value={value}
      error={error}
      disabled={disabled || !branchUuid}
      onChange={onChange}
    />
  );
}
