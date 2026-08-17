"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { companyFormSchema, type CompanyFormValues } from "../schemas/company.schema";

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
  country: "",
  timeZone: "",
  financialYearStartMonth: 1,
  financialYearStartDay: 1,
};

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
        <TextInput
          label="Base Currency Code"
          placeholder="USD"
          maxLength={3}
          error={errors.baseCurrencyCode?.message}
          {...register("baseCurrencyCode")}
        />
        <TextInput label="Country" error={errors.country?.message} {...register("country")} />
        <TextInput
          label="Time Zone"
          placeholder="Asia/Kolkata"
          error={errors.timeZone?.message}
          {...register("timeZone")}
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
