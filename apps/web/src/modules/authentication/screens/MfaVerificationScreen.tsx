"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { OtpInput } from "@/components/ui/OtpInput";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { ShieldCheckIcon } from "@/components/ui/icons";
import { useVerifyMfa } from "../hooks/use-verify-mfa";
import { useAuth } from "../hooks/use-auth";
import { getAuthErrorMessage } from "../utils/auth-error-messages";
import { verifyMfaFormSchema, type VerifyMfaFormValues } from "../schemas/verify-mfa.schema";

// The mfaChallengeToken lives only in AuthContext's in-memory state
// (never persisted) — a page reload mid-challenge loses it by design,
// consistent with SESS-001's treatment of security-sensitive tokens.
export function MfaVerificationScreen() {
  const router = useRouter();
  const { mfaChallengeToken, completeLogin } = useAuth();
  const verifyMfaMutation = useVerifyMfa();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyMfaFormValues>({
    resolver: zodResolver(verifyMfaFormSchema),
    defaultValues: { totpCode: "" },
  });

  useEffect(() => {
    if (!mfaChallengeToken) {
      router.replace("/login");
    }
  }, [mfaChallengeToken, router]);

  function onSubmit(values: VerifyMfaFormValues) {
    if (!mfaChallengeToken) {
      return;
    }
    verifyMfaMutation.mutate(
      { mfaChallengeToken, totpCode: values.totpCode },
      {
        onSuccess: (response) => {
          completeLogin(response.accessToken);
          router.push("/");
        },
      },
    );
  }

  if (!mfaChallengeToken) {
    return null;
  }

  return (
    <div>
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/15 text-primary-500">
          <ShieldCheckIcon className="h-6 w-6" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-ink">
          Verify your identity
        </h1>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-ink-muted">
          Enter the 6-digit code from your authenticator app.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <ErrorAlert message={getAuthErrorMessage(verifyMfaMutation.error)} />
        <OtpInput label="Authentication code" error={errors.totpCode?.message} {...register("totpCode")} />
        <LoadingButton
          type="submit"
          isLoading={verifyMfaMutation.isPending}
          loadingLabel="Verifying…"
          className="w-full"
        >
          Verify
        </LoadingButton>
      </form>
    </div>
  );
}
