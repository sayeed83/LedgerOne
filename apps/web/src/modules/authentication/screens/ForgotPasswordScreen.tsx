"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ErrorAlert, HashIcon, LoadingButton, MailIcon, SuccessAlert, TextInput } from "@ledgerone/ui";
import { useForgotPassword } from "../hooks/use-forgot-password";
import { getAuthErrorMessage } from "../utils/auth-error-messages";
import {
  forgotPasswordFormSchema,
  type ForgotPasswordFormValues,
} from "../schemas/forgot-password.schema";

export function ForgotPasswordScreen() {
  const forgotPasswordMutation = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { tenantId: "", email: "" },
  });

  function onSubmit(values: ForgotPasswordFormValues) {
    forgotPasswordMutation.mutate(values);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-ink">
          Forgot password
        </h1>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-ink-muted">
          Enter your Tenant ID and email — if an account exists, we&apos;ll send a reset link.
        </p>
      </div>

      {forgotPasswordMutation.isSuccess ? (
        <div className="flex flex-col gap-5">
          <SuccessAlert message={forgotPasswordMutation.data.message} />
          <Link
            href="/login"
            className="text-center text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Back to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          <ErrorAlert message={getAuthErrorMessage(forgotPasswordMutation.error)} />
          <TextInput
            label="Tenant ID"
            icon={<HashIcon className="h-[18px] w-[18px]" />}
            hint="Temporary — required until tenant resolution is available."
            error={errors.tenantId?.message}
            placeholder="1"
            {...register("tenantId")}
          />
          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            icon={<MailIcon className="h-[18px] w-[18px]" />}
            placeholder="you@company.com"
            error={errors.email?.message}
            {...register("email")}
          />
          <LoadingButton
            type="submit"
            isLoading={forgotPasswordMutation.isPending}
            loadingLabel="Sending…"
            className="w-full"
          >
            Send reset link
          </LoadingButton>
          <Link
            href="/login"
            className="text-center text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Back to log in
          </Link>
        </form>
      )}
    </div>
  );
}
