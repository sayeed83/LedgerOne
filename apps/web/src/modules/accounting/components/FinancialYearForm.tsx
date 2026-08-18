"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { financialYearFormSchema, type FinancialYearFormValues } from "../schemas/financial-year.schema";
import { CompanySelect } from "./CompanySelect";

export interface FinancialYearFormProps {
  defaultValues?: FinancialYearFormValues;
  onSubmit: (values: FinancialYearFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
  // The backend's update-financial-year.dto.ts has no `companyUuid` field —
  // a Financial Year's Company never changes after creation, so the Edit
  // form (defaultValues present) keeps it read-only instead of re-showing
  // the picker.
  isEditing?: boolean;
}

const EMPTY_VALUES: FinancialYearFormValues = { companyUuid: "", startDate: "", endDate: "" };

export function FinancialYearForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
  isEditing = false,
}: FinancialYearFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<FinancialYearFormValues>({
    resolver: zodResolver(financialYearFormSchema),
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof FinancialYearFormValues;
      if (field in EMPTY_VALUES) {
        setError(field, { type: "server", message: detail.message });
      }
    });
  }, [fieldErrors, setError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <ErrorAlert message={serverError} />
      {isEditing ? (
        <input type="hidden" {...register("companyUuid")} />
      ) : (
        <Controller
          name="companyUuid"
          control={control}
          render={({ field }) => (
            <CompanySelect value={field.value} onChange={field.onChange} error={errors.companyUuid?.message} />
          )}
        />
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput label="Start Date" type="date" error={errors.startDate?.message} {...register("startDate")} />
        <TextInput label="End Date" type="date" error={errors.endDate?.message} {...register("endDate")} />
      </div>
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
