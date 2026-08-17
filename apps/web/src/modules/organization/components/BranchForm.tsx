"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { branchFormSchema, type BranchFormValues } from "../schemas/branch.schema";

export interface BranchFormProps {
  defaultValues?: BranchFormValues;
  onSubmit: (values: BranchFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
}

const EMPTY_VALUES: BranchFormValues = {
  branchCode: "",
  branchName: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  region: "",
  postalCode: "",
  countryCode: "",
  timeZone: "",
};

// FORM-001: React Hook Form, no ad hoc per-field useState.
export function BranchForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
}: BranchFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchFormSchema),
    defaultValues: defaultValues ?? EMPTY_VALUES,
  });

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof BranchFormValues;
      if (field in EMPTY_VALUES) {
        setError(field, { type: "server", message: detail.message });
      }
    });
  }, [fieldErrors, setError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <ErrorAlert message={serverError} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput label="Branch Code" error={errors.branchCode?.message} {...register("branchCode")} />
        <TextInput label="Branch Name" error={errors.branchName?.message} {...register("branchName")} />
        <TextInput
          label="Address Line 1"
          className="sm:col-span-2"
          error={errors.addressLine1?.message}
          {...register("addressLine1")}
        />
        <TextInput
          label="Address Line 2"
          className="sm:col-span-2"
          error={errors.addressLine2?.message}
          {...register("addressLine2")}
        />
        <TextInput label="City" error={errors.city?.message} {...register("city")} />
        <TextInput label="Region" error={errors.region?.message} {...register("region")} />
        <TextInput label="Postal Code" error={errors.postalCode?.message} {...register("postalCode")} />
        <TextInput
          label="Country Code"
          placeholder="IN"
          error={errors.countryCode?.message}
          {...register("countryCode")}
        />
        <TextInput
          label="Time Zone"
          placeholder="Asia/Kolkata"
          className="sm:col-span-2"
          error={errors.timeZone?.message}
          {...register("timeZone")}
        />
      </div>
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
