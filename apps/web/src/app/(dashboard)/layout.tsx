import type { ReactNode } from "react";
import { ProtectedRoute } from "@/modules/authentication/components/ProtectedRoute";

// ROUTE-004: the auth guard is centralized here, at the layout level, for
// every route under (dashboard) — never duplicated per page.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
