"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { tenantFormSchema, type TenantFormValues } from "../schemas/tenant.schema";

export interface TenantFormProps {
  defaultValues?: TenantFormValues;
  onSubmit: (values: TenantFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
}

// FORM-001: React Hook Form, no ad hoc per-field useState.
export function TenantForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
}: TenantFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: defaultValues ?? { legalName: "", primaryContactEmail: "" },
  });

  // FORM-002/003: a server-rejected 422's field-level details are mapped
  // onto the corresponding RHF field even though client validation passed.
  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      if (detail.field === "legalName" || detail.field === "primaryContactEmail") {
        setError(detail.field, { type: "server", message: detail.message });
      }
    });
  }, [fieldErrors, setError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <ErrorAlert message={serverError} />
      <TextInput
        label="Legal Name"
        placeholder="Acme Corporation Ltd."
        error={errors.legalName?.message}
        {...register("legalName")}
      />
      <TextInput
        label="Primary Contact Email"
        type="email"
        placeholder="finance@acme.com"
        error={errors.primaryContactEmail?.message}
        {...register("primaryContactEmail")}
      />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
