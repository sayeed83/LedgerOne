"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { taxGroupFormSchema, type TaxGroupFormValues } from "../schemas/tax-group.schema";
import { CompanySelect } from "./CompanySelect";

export interface TaxGroupFormProps {
  defaultValues?: TaxGroupFormValues;
  onSubmit: (values: TaxGroupFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
  isEditing?: boolean;
}

const EMPTY_VALUES: TaxGroupFormValues = { companyUuid: "", name: "" };

export function TaxGroupForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
  isEditing = false,
}: TaxGroupFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<TaxGroupFormValues>({
    resolver: zodResolver(taxGroupFormSchema),
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof TaxGroupFormValues;
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
      <TextInput label="Name" error={errors.name?.message} {...register("name")} />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
