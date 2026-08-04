"use client";

import { LoadingButton } from "@ledgerone/ui";
import { useLogout } from "@/modules/authentication/hooks/use-logout";

// Placeholder authenticated landing page — the dashboard shell itself is
// out of scope for the Authentication Frontend module; this exists only
// to prove ProtectedRoute + logout work end-to-end.
export default function DashboardHomePage() {
  const logoutMutation = useLogout();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
        You&apos;re logged in
      </h1>
      <LoadingButton
        onClick={() => logoutMutation.mutate()}
        isLoading={logoutMutation.isPending}
        loadingLabel="Logging out…"
      >
        Log out
      </LoadingButton>
    </div>
  );
}
