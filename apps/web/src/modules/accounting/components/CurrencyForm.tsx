"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { currencyFormSchema, type CurrencyFormValues } from "../schemas/currency.schema";

export interface CurrencyFormProps {
  defaultValues?: CurrencyFormValues;
  onSubmit: (values: CurrencyFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
  isEditing?: boolean;
}

const EMPTY_VALUES: CurrencyFormValues = { isoCode: "", name: "", symbol: "", decimalPrecision: 2 };

export function CurrencyForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
  isEditing = false,
}: CurrencyFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CurrencyFormValues>({
    resolver: zodResolver(currencyFormSchema),
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof CurrencyFormValues;
      if (field in EMPTY_VALUES) {
        setError(field, { type: "server", message: detail.message });
      }
    });
  }, [fieldErrors, setError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <ErrorAlert message={serverError} />
      <TextInput
        label="ISO Code"
        placeholder="USD"
        maxLength={3}
        disabled={isEditing}
        error={errors.isoCode?.message}
        {...register("isoCode")}
      />
      <TextInput label="Name" error={errors.name?.message} {...register("name")} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput label="Symbol" placeholder="$" error={errors.symbol?.message} {...register("symbol")} />
        <TextInput
          label="Decimal Precision"
          type="number"
          min={0}
          max={255}
          error={errors.decimalPrecision?.message}
          {...register("decimalPrecision")}
        />
      </div>
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
