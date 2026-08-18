"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, Textarea, TextInput } from "@ledgerone/ui";
import { journalEntryFormSchema, type JournalEntryFormValues } from "../schemas/journal-entry.schema";
import { CompanySelect } from "./CompanySelect";
import { JournalLineGrid } from "./JournalLineGrid";

export interface JournalEntryFormProps {
  companyUuid?: string;
  onSubmit: (values: JournalEntryFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
}

const EMPTY_VALUES: JournalEntryFormValues = {
  companyUuid: "",
  postingDate: "",
  narration: "",
  lines: [
    { accountUuid: "", debitAmount: "", creditAmount: "" },
    { accountUuid: "", debitAmount: "", creditAmount: "" },
  ],
};

// PAGE-002's "header + line-items grid" composition — a smart-ish module
// component (not components/ui) since it wires the Company-scoped
// AccountPicker inside JournalLineGrid.
export function JournalEntryForm({
  companyUuid,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save Draft",
}: JournalEntryFormProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<JournalEntryFormValues>({
    resolver: zodResolver(journalEntryFormSchema),
    defaultValues: { ...EMPTY_VALUES, companyUuid: companyUuid ?? "" },
  });

  const selectedCompanyUuid = watch("companyUuid");

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      if (detail.field === "companyUuid" || detail.field === "postingDate" || detail.field === "narration") {
        setError(detail.field, { type: "server", message: detail.message });
      }
    });
  }, [fieldErrors, setError]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      <ErrorAlert message={serverError} />
      {companyUuid ? (
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput
          label="Posting Date"
          type="date"
          error={errors.postingDate?.message}
          {...register("postingDate")}
        />
      </div>
      <Textarea label="Narration" error={errors.narration?.message} {...register("narration")} />

      <JournalLineGrid companyUuid={selectedCompanyUuid} control={control} errors={errors} />

      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
