"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { fiscalPeriodFormSchema, type FiscalPeriodFormValues } from "../schemas/fiscal-period.schema";

export interface FiscalPeriodFormProps {
  financialYearUuid: string;
  defaultValues?: Pick<FiscalPeriodFormValues, "startDate" | "endDate">;
  onSubmit: (values: FiscalPeriodFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
}

// A Fiscal Period is always created/edited from within its parent Financial
// Year's own detail screen (PAGE-002 related-data section) — the parent
// uuid is a fixed prop, never a field the operator picks in this form.
export function FiscalPeriodForm({
  financialYearUuid,
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
}: FiscalPeriodFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FiscalPeriodFormValues>({
    resolver: zodResolver(fiscalPeriodFormSchema),
    defaultValues: { financialYearUuid, startDate: "", endDate: "", ...defaultValues },
  });

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof FiscalPeriodFormValues;
      if (field === "startDate" || field === "endDate") {
        setError(field, { type: "server", message: detail.message });
      }
    });
  }, [fieldErrors, setError]);

  return (
    <form
      onSubmit={handleSubmit((values) => onSubmit({ ...values, financialYearUuid }))}
      className="flex flex-col gap-5"
      noValidate
    >
      <ErrorAlert message={serverError} />
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
