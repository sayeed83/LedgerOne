import type { ReactNode } from "react";
import { AuthShell } from "@/layouts/auth-shell.layout";

// ROUTE-003: this route group only composes layout for unauthenticated/
// public auth pages — no screen logic lives here.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
