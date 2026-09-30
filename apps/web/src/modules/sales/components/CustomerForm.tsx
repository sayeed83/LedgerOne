"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomerStatus, type AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, Select, TextInput } from "@ledgerone/ui";
import { customerFormSchema, type CustomerFormValues } from "../schemas/customer.schema";
import { CompanySelect } from "./CompanySelect";

export interface CustomerFormProps {
  companyUuid?: string;
  defaultValues?: CustomerFormValues;
  onSubmit: (values: CustomerFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
  isEditing?: boolean;
}

const CUSTOMER_STATUS_OPTIONS = Object.values(CustomerStatus).map((value) => ({ value, label: value }));

// Mirrors ProductForm.tsx's exact pattern (its closest existing analog: a
// Company-scoped entity with a status enum and no in-module picker
// dependencies). Business Location (Ch.9) and Price List (Ch.46) are not
// modeled — address fields are inlined directly on Customer (mirroring the
// backend's own Database-milestone precedent), and no Price List field
// exists to pick.
export function CustomerForm({
  companyUuid,
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
  isEditing = false,
}: CustomerFormProps) {
  const emptyValues: CustomerFormValues = {
    companyUuid: companyUuid ?? "",
    name: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    region: "",
    postalCode: "",
    countryCode: "",
    creditLimit: "",
    paymentTerms: "",
    status: CustomerStatus.Prospect,
  };

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: defaultValues ?? emptyValues,
  });

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof CustomerFormValues;
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
          addressLine1: values.addressLine1 || undefined,
          addressLine2: values.addressLine2 || undefined,
          city: values.city || undefined,
          region: values.region || undefined,
          postalCode: values.postalCode || undefined,
          countryCode: values.countryCode || undefined,
          creditLimit: values.creditLimit || undefined,
          paymentTerms: values.paymentTerms || undefined,
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput
          label="Address Line 1 (optional)"
          error={errors.addressLine1?.message}
          {...register("addressLine1")}
        />
        <TextInput
          label="Address Line 2 (optional)"
          error={errors.addressLine2?.message}
          {...register("addressLine2")}
        />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <TextInput label="City (optional)" error={errors.city?.message} {...register("city")} />
        <TextInput label="Region (optional)" error={errors.region?.message} {...register("region")} />
        <TextInput label="Postal Code (optional)" error={errors.postalCode?.message} {...register("postalCode")} />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput
          label="Country Code (optional)"
          hint="ISO 3166-1 alpha-2, e.g. GB."
          error={errors.countryCode?.message}
          {...register("countryCode")}
        />
        <TextInput
          label="Credit Limit (optional)"
          hint="Defaults to zero — a zero limit means no credit is extended."
          error={errors.creditLimit?.message}
          {...register("creditLimit")}
        />
      </div>
      <TextInput
        label="Payment Terms (optional)"
        hint="e.g. Net-30."
        error={errors.paymentTerms?.message}
        {...register("paymentTerms")}
      />
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <Select
            label="Status"
            options={CUSTOMER_STATUS_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            error={errors.status?.message}
          />
        )}
      />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
