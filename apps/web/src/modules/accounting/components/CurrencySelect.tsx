"use client";

import { Select } from "@ledgerone/ui";
import { CurrencyStatus } from "@ledgerone/shared-types";
import { useCurrencies } from "../hooks/use-currencies";

export interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  error?: string;
  excludeUuid?: string;
}

export function CurrencySelect({ value, onChange, label, error, excludeUuid }: CurrencySelectProps) {
  const currenciesQuery = useCurrencies(CurrencyStatus.Active);
  const options = (currenciesQuery.data ?? [])
    .filter((currency) => currency.uuid !== excludeUuid)
    .map((currency) => ({ value: currency.uuid, label: `${currency.isoCode} — ${currency.name}` }));

  return (
    <Select
      label={label}
      placeholder={currenciesQuery.isLoading ? "Loading currencies…" : "Select a currency"}
      options={options}
      value={value}
      error={error}
      onChange={onChange}
    />
  );
}
