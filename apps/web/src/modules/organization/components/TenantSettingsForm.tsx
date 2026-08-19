"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { tenantSettingsFormSchema, type TenantSettingsFormValues } from "../schemas/tenant-settings.schema";

export interface TenantSettingsFormProps {
  defaultValues?: TenantSettingsFormValues;
  onSubmit: (values: TenantSettingsFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
}

// Mirrors TenantForm.tsx's exact pattern — the only other single-record,
// no-list Organization form.
export function TenantSettingsForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
}: TenantSettingsFormProps) {
  const emptyValues: TenantSettingsFormValues = {
    defaultCurrencyCode: "",
    defaultTimeZone: "",
    defaultFinancialYearPattern: "",
  };

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TenantSettingsFormValues>({
    resolver: zodResolver(tenantSettingsFormSchema),
    defaultValues: defaultValues ?? emptyValues,
  });

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof TenantSettingsFormValues;
      if (field in emptyValues) {
        setError(field, { type: "server", message: detail.message });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldErrors, setError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <ErrorAlert message={serverError} />
      <TextInput
        label="Default Currency Code"
        placeholder="USD"
        hint="A 3-letter ISO 4217 code, inherited by every new Company (ORG-003)."
        error={errors.defaultCurrencyCode?.message}
        {...register("defaultCurrencyCode")}
      />
      <TextInput
        label="Default Time Zone"
        placeholder="America/New_York"
        hint="An IANA time zone identifier."
        error={errors.defaultTimeZone?.message}
        {...register("defaultTimeZone")}
      />
      <TextInput
        label="Default Financial Year Pattern"
        placeholder="APR-MAR"
        hint="E.g. APR-MAR for an April-to-March fiscal calendar."
        error={errors.defaultFinancialYearPattern?.message}
        {...register("defaultFinancialYearPattern")}
      />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
