"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, TextInput } from "@ledgerone/ui";
import { taxRuleFormSchema, type TaxRuleFormValues } from "../schemas/tax-rule.schema";

export interface TaxRuleFormProps {
  taxGroupUuid: string;
  onSubmit: (values: TaxRuleFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
}

// Tax Rules are immutable (create/get/list only) — always created from
// within the parent Tax Group's own detail screen, mirroring
// FiscalPeriodForm's "parent uuid is a fixed prop" pattern.
export function TaxRuleForm({ taxGroupUuid, onSubmit, isSubmitting, serverError, fieldErrors }: TaxRuleFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<TaxRuleFormValues>({
    resolver: zodResolver(taxRuleFormSchema),
    defaultValues: { taxGroupUuid, rate: "", effectiveFrom: "", effectiveTo: "" },
  });

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof TaxRuleFormValues;
      if (field === "rate" || field === "effectiveFrom" || field === "effectiveTo") {
        setError(field, { type: "server", message: detail.message });
      }
    });
  }, [fieldErrors, setError]);

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({ ...values, taxGroupUuid, effectiveTo: values.effectiveTo || undefined }),
      )}
      className="flex flex-col gap-5"
      noValidate
    >
      <ErrorAlert message={serverError} />
      <TextInput label="Rate (%)" placeholder="18.00" error={errors.rate?.message} {...register("rate")} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput
          label="Effective From"
          type="date"
          error={errors.effectiveFrom?.message}
          {...register("effectiveFrom")}
        />
        <TextInput
          label="Effective To"
          type="date"
          hint="Leave blank if this rule has no end date."
          error={errors.effectiveTo?.message}
          {...register("effectiveTo")}
        />
      </div>
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        Create Tax Rule
      </LoadingButton>
    </form>
  );
}
