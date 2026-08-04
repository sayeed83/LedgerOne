"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/use-auth";

interface ProtectedRouteProps {
  children: ReactNode;
}

// ROUTE-004: auth guard centralized at the layout level, not duplicated
// per page. FP1: this is a UX redirect only — every protected endpoint
// still independently re-checks the Bearer token server-side.
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitializing, isAuthenticated, router]);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center" role="status" aria-live="polite">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600"
          aria-hidden="true"
        />
        <span className="sr-only">Loading your session…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
