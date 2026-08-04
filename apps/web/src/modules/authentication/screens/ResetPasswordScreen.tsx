"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ErrorAlert,
  HashIcon,
  LoadingButton,
  LockIcon,
  PasswordInput,
  SuccessAlert,
  TextInput,
} from "@ledgerone/ui";
import { useResetPassword } from "../hooks/use-reset-password";
import { getAuthErrorMessage } from "../utils/auth-error-messages";
import {
  resetPasswordFormSchema,
  type ResetPasswordFormValues,
} from "../schemas/reset-password.schema";

// Reads `tenantId`/`token` from the reset link's query string (§6/§9 of
// the module spec) — pre-fills them but keeps both editable, since
// forgot-password's email delivery is a documented gap (no real link
// exists yet outside direct repository access during manual testing).
export function ResetPasswordScreen() {
  const searchParams = useSearchParams();
  const resetPasswordMutation = useResetPassword();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      tenantId: searchParams.get("tenantId") ?? "",
      token: searchParams.get("token") ?? "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    resetPasswordMutation.error?.details?.forEach((detail) => {
      if (detail.field === "tenantId" || detail.field === "token" || detail.field === "newPassword") {
        setError(detail.field, { type: "server", message: detail.message });
      }
    });
  }, [resetPasswordMutation.error, setError]);

  function onSubmit(values: ResetPasswordFormValues) {
    resetPasswordMutation.mutate({
      tenantId: values.tenantId,
      token: values.token,
      newPassword: values.newPassword,
    });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-ink">
          Reset password
        </h1>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-ink-muted">
          Choose a new password — 12 to 128 characters, no composition rules required.
        </p>
      </div>

      {resetPasswordMutation.isSuccess ? (
        <div className="flex flex-col gap-5">
          <SuccessAlert message={resetPasswordMutation.data.message} />
          <Link
            href="/login"
            className="text-center text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Continue to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          <ErrorAlert message={getAuthErrorMessage(resetPasswordMutation.error)} />
          <TextInput
            label="Tenant ID"
            icon={<HashIcon className="h-[18px] w-[18px]" />}
            error={errors.tenantId?.message}
            placeholder="1"
            {...register("tenantId")}
          />
          <TextInput
            label="Reset token"
            icon={<LockIcon className="h-[18px] w-[18px]" />}
            error={errors.token?.message}
            {...register("token")}
          />
          <PasswordInput
            label="New password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          <PasswordInput
            label="Confirm new password"
            autoComplete="new-password"
            error={errors.confirmNewPassword?.message}
            {...register("confirmNewPassword")}
          />
          <LoadingButton
            type="submit"
            isLoading={resetPasswordMutation.isPending}
            loadingLabel="Resetting…"
            className="w-full"
          >
            Reset password
          </LoadingButton>
        </form>
      )}
    </div>
  );
}
