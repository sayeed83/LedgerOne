"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { exchangeRateFormSchema, type ExchangeRateFormValues } from "../schemas/exchange-rate.schema";
import { CurrencySelect } from "./CurrencySelect";

export interface ExchangeRateFormProps {
  onSubmit: (values: ExchangeRateFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
}

const EMPTY_VALUES: ExchangeRateFormValues = {
  fromCurrencyUuid: "",
  toCurrencyUuid: "",
  rate: "",
  effectiveDate: "",
};

// Exchange Rates are immutable (create/get/list only) — this form has no
// "editing" mode, mirroring `accounting.service.ts`'s create-only wrapper.
export function ExchangeRateForm({ onSubmit, isSubmitting, serverError, fieldErrors }: ExchangeRateFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    watch,
    formState: { errors },
  } = useForm<ExchangeRateFormValues>({
    resolver: zodResolver(exchangeRateFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  const fromCurrencyUuid = watch("fromCurrencyUuid");

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof ExchangeRateFormValues;
      if (field in EMPTY_VALUES) {
        setError(field, { type: "server", message: detail.message });
      }
    });
  }, [fieldErrors, setError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <ErrorAlert message={serverError} />
      <Controller
        name="fromCurrencyUuid"
        control={control}
        render={({ field }) => (
          <CurrencySelect
            label="From Currency"
            value={field.value}
            onChange={field.onChange}
            error={errors.fromCurrencyUuid?.message}
          />
        )}
      />
      <Controller
        name="toCurrencyUuid"
        control={control}
        render={({ field }) => (
          <CurrencySelect
            label="To Currency"
            value={field.value}
            onChange={field.onChange}
            error={errors.toCurrencyUuid?.message}
            excludeUuid={fromCurrencyUuid}
          />
        )}
      />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput label="Rate" placeholder="83.250000" error={errors.rate?.message} {...register("rate")} />
        <TextInput
          label="Effective Date"
          type="date"
          error={errors.effectiveDate?.message}
          {...register("effectiveDate")}
        />
      </div>
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        Create Exchange Rate
      </LoadingButton>
    </form>
  );
}
