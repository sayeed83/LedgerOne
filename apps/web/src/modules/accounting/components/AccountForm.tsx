"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountType, type AuthErrorFieldDetailDto } from "@ledgerone/shared-types";
import { ErrorAlert, LoadingButton, Select, Switch, TextInput } from "@ledgerone/ui";
import { accountFormSchema, type AccountFormValues } from "../schemas/account.schema";
import { CompanySelect } from "./CompanySelect";
import { AccountGroupSelect } from "./AccountGroupSelect";
import { AccountPicker } from "./AccountPicker";

export interface AccountFormProps {
  companyUuid?: string;
  defaultValues?: AccountFormValues;
  onSubmit: (values: AccountFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
  fieldErrors?: AuthErrorFieldDetailDto[];
  submitLabel?: string;
  isEditing?: boolean;
  excludeAccountUuid?: string;
}

const ACCOUNT_TYPE_OPTIONS = Object.values(AccountType).map((value) => ({ value, label: value }));

export function AccountForm({
  companyUuid,
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
  fieldErrors,
  submitLabel = "Save",
  isEditing = false,
  excludeAccountUuid,
}: AccountFormProps) {
  const emptyValues: AccountFormValues = {
    companyUuid: companyUuid ?? "",
    code: "",
    name: "",
    accountType: AccountType.Asset,
    accountGroupUuid: "",
    parentAccountUuid: "",
    isPostingAccount: true,
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    formState: { errors },
  } = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: defaultValues ?? emptyValues,
  });

  const selectedCompanyUuid = watch("companyUuid");

  useEffect(() => {
    fieldErrors?.forEach((detail) => {
      const field = detail.field as keyof AccountFormValues;
      if (field in emptyValues) {
        setError(field, { type: "server", message: detail.message });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldErrors, setError]);

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({ ...values, parentAccountUuid: values.parentAccountUuid || undefined }),
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextInput label="Code" disabled={isEditing} error={errors.code?.message} {...register("code")} />
        <TextInput label="Name" error={errors.name?.message} {...register("name")} />
      </div>
      <Controller
        name="accountType"
        control={control}
        render={({ field }) => (
          <Select
            label="Account Type"
            options={ACCOUNT_TYPE_OPTIONS}
            value={field.value}
            onChange={field.onChange}
            disabled={isEditing}
            error={errors.accountType?.message}
          />
        )}
      />
      <Controller
        name="accountGroupUuid"
        control={control}
        render={({ field }) => (
          <AccountGroupSelect
            companyUuid={selectedCompanyUuid}
            value={field.value}
            onChange={field.onChange}
            error={errors.accountGroupUuid?.message}
          />
        )}
      />
      <Controller
        name="parentAccountUuid"
        control={control}
        render={({ field }) => (
          <AccountPicker
            companyUuid={selectedCompanyUuid}
            value={field.value ?? ""}
            onChange={field.onChange}
            label="Parent Account (optional)"
            error={errors.parentAccountUuid?.message}
            excludeUuid={excludeAccountUuid}
          />
        )}
      />
      <Controller
        name="isPostingAccount"
        control={control}
        render={({ field }) => (
          <Switch
            label="Posting Account"
            hint="Journal Entries can post directly to a Posting Account."
            checked={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        {submitLabel}
      </LoadingButton>
    </form>
  );
}
