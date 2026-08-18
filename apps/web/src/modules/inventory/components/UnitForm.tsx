"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { unitFormSchema, type UnitFormValues } from "../schemas/unit.schema";
import { CompanySelect } from "./CompanySelect";
import { BaseUnitSelect } from "./BaseUnitSelect";

export interface UnitFormProps {
  companyUuid?: string;
  defaultValues?: UnitFormValues;
  onSubmit: (values: UnitFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
  isEditing?: boolean;
  excludeUnitUuid?: string;
}

// Mirrors Account Group's own AccountGroupForm.tsx pattern exactly.
export function UnitForm({
  companyUuid,
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
  isEditing = false,
  excludeUnitUuid,
}: UnitFormProps) {
  const emptyValues: UnitFormValues = {
    companyUuid: companyUuid ?? "",
    name: "",
    symbol: "",
    baseUnitUuid: "",
    conversionFactor: "",
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<UnitFormValues>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: defaultValues ?? emptyValues,
  });

  const selectedCompanyUuid = watch("companyUuid");

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof UnitFormValues;
      if (field in emptyValues) {
        setError(field, { type: "server", message: detail.message });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldErrors, setError]);

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          baseUnitUuid: values.baseUnitUuid || undefined,
          conversionFactor: values.conversionFactor || undefined,
        }),
      )}
      className="flex flex-col gap-5"
      noValidate
    >
      <ErrorAlert message={serverError} />
      {isEditing || companyUuid ? (
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
      <TextInput label="Name" error={errors.name?.message} {...register("name")} />
      <TextInput label="Symbol" error={errors.symbol?.message} {...register("symbol")} />
      <Controller
        name="baseUnitUuid"
        control={control}
        render={({ field }) => (
          <BaseUnitSelect
            companyUuid={selectedCompanyUuid}
            value={field.value ?? ""}
            onChange={field.onChange}
            label="Base Unit (optional)"
            error={errors.baseUnitUuid?.message}
            excludeUuid={excludeUnitUuid}
            optional
          />
        )}
      />
      <TextInput
        label="Conversion Factor (optional)"
        hint="Required only for an alternate Unit — e.g. 100 for a Box of 100 Pieces."
        error={errors.conversionFactor?.message}
        {...register("conversionFactor")}
      />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
