"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, Select, TextInput } from "@ledgerone/ui";
import { companyFormSchema, type CompanyFormValues } from "../schemas/company.schema";
import { DEFAULT_COUNTRY_CODE, ISO_COUNTRY_CODES } from "../constants/countries";

export interface CompanyFormProps {
  defaultValues?: CompanyFormValues;
  onSubmit: (values: CompanyFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
}

const EMPTY_VALUES: CompanyFormValues = {
  companyCode: "",
  legalName: "",
  displayName: "",
  legalEntityType: "",
  taxRegistrationNumber: "",
  baseCurrencyCode: "",
  country: DEFAULT_COUNTRY_CODE,
  timeZone: "",
  financialYearStartMonth: 1,
  financialYearStartDay: 1,
};

// Currency/timezone codes come straight from the runtime's own ISO 4217 /
// IANA tz-database data (the Intl Enumeration API, Baseline-supported) —
// no hand-maintained list to drift out of date, and (unlike country) no
// static fallback array is kept alongside it: every browser/Node runtime
// this app targets already ships both keys.
const CURRENCY_OPTIONS = Intl.supportedValuesOf("currency")
  .map((code) => {
    const name = new Intl.DisplayNames(["en"], { type: "currency" }).of(code);
    return { value: code, label: name && name !== code ? `${code} — ${name}` : code };
  })
  .sort((a, b) => a.value.localeCompare(b.value));

const TIME_ZONE_OPTIONS = Intl.supportedValuesOf("timeZone")
  .map((zone) => ({ value: zone, label: zone }))
  .sort((a, b) => a.value.localeCompare(b.value));

// Country *codes* are a static list (constants/countries.ts) — no Intl key
// enumerates ISO 3166-1 — but display names still come from `Intl
// .DisplayNames` at render time so they can't drift from it.
const countryDisplayNames = new Intl.DisplayNames(["en"], { type: "region" });
const COUNTRY_OPTIONS = ISO_COUNTRY_CODES.map((code) => ({
  value: code,
  label: `${countryDisplayNames.of(code) ?? code} (${code})`,
})).sort((a, b) => a.label.localeCompare(b.label));

// FORM-001: React Hook Form, no ad hoc per-field useState.
export function CompanyForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
}: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });

  // FORM-002/003: a server-rejected 422's field-level details are mapped
  // onto the corresponding RHF field even though client validation passed.
  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof CompanyFormValues;
      if (field in EMPTY_VALUES) {
        setError(field, { type: "server", message: detail.message });
      }
    });
  }, [fieldErrors, setError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <ErrorAlert message={serverError} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput label="Company Code" error={errors.companyCode?.message} {...register("companyCode")} />
        <TextInput label="Legal Name" error={errors.legalName?.message} {...register("legalName")} />
        <TextInput label="Display Name" error={errors.displayName?.message} {...register("displayName")} />
        <TextInput
          label="Legal Entity Type"
          placeholder="Private Limited"
          error={errors.legalEntityType?.message}
          {...register("legalEntityType")}
        />
        <TextInput
          label="Tax Registration Number"
          error={errors.taxRegistrationNumber?.message}
          {...register("taxRegistrationNumber")}
        />
        <Controller
          name="baseCurrencyCode"
          control={control}
          render={({ field }) => (
            <Select
              label="Base Currency Code"
              options={CURRENCY_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.baseCurrencyCode?.message}
            />
          )}
        />
        <Controller
          name="country"
          control={control}
          render={({ field }) => (
            <Select
              label="Country"
              options={COUNTRY_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.country?.message}
            />
          )}
        />
        <Controller
          name="timeZone"
          control={control}
          render={({ field }) => (
            <Select
              label="Time Zone"
              options={TIME_ZONE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={errors.timeZone?.message}
            />
          )}
        />
        <TextInput
          label="Financial Year Start Month"
          type="number"
          min={1}
          max={12}
          error={errors.financialYearStartMonth?.message}
          {...register("financialYearStartMonth")}
        />
        <TextInput
          label="Financial Year Start Day"
          type="number"
          min={1}
          max={31}
          error={errors.financialYearStartDay?.message}
          {...register("financialYearStartDay")}
        />
      </div>
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
