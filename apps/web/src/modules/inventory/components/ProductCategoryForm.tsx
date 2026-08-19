"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { productCategoryFormSchema, type ProductCategoryFormValues } from "../schemas/product-category.schema";
import { CompanySelect } from "./CompanySelect";
import { ParentProductCategorySelect } from "./ParentProductCategorySelect";
import { TaxGroupSelect } from "./TaxGroupSelect";

export interface ProductCategoryFormProps {
  companyUuid?: string;
  defaultValues?: ProductCategoryFormValues;
  onSubmit: (values: ProductCategoryFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
  isEditing?: boolean;
  excludeProductCategoryUuid?: string;
}

// Mirrors UnitForm.tsx's exact pattern (its closest existing analog: a
// Company-scoped, self-referential-parent reference-data entity with one
// further optional cross-module picker).
export function ProductCategoryForm({
  companyUuid,
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
  isEditing = false,
  excludeProductCategoryUuid,
}: ProductCategoryFormProps) {
  const emptyValues: ProductCategoryFormValues = {
    companyUuid: companyUuid ?? "",
    name: "",
    parentProductCategoryUuid: "",
    defaultTaxGroupUuid: "",
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<ProductCategoryFormValues>({
    resolver: zodResolver(productCategoryFormSchema),
    defaultValues: defaultValues ?? emptyValues,
  });

  const selectedCompanyUuid = watch("companyUuid");

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof ProductCategoryFormValues;
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
          parentProductCategoryUuid: values.parentProductCategoryUuid || undefined,
          defaultTaxGroupUuid: values.defaultTaxGroupUuid || undefined,
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
      <Controller
        name="parentProductCategoryUuid"
        control={control}
        render={({ field }) => (
          <ParentProductCategorySelect
            companyUuid={selectedCompanyUuid}
            value={field.value ?? ""}
            onChange={field.onChange}
            error={errors.parentProductCategoryUuid?.message}
            excludeUuid={excludeProductCategoryUuid}
          />
        )}
      />
      <Controller
        name="defaultTaxGroupUuid"
        control={control}
        render={({ field }) => (
          <TaxGroupSelect
            companyUuid={selectedCompanyUuid}
            value={field.value ?? ""}
            onChange={field.onChange}
            error={errors.defaultTaxGroupUuid?.message}
          />
        )}
      />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
