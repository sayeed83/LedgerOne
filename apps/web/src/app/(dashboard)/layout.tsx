import type { ReactNode } from "react";
import { ProtectedRoute } from "@/modules/authentication/components/ProtectedRoute";
import { ErpShell } from "@/layouts/erp-shell.layout";
import { CurrentTenantProvider } from "@/context/current-tenant.context";

// ROUTE-004: the auth guard is centralized here, at the layout level, for
// every route under (dashboard) — never duplicated per page. LAY-001: the
// ERP shell (persistent nav, header, breadcrumb) wraps every authenticated
// route the same way, also centralized here rather than per-screen.
// STATE-003: the current-Tenant context (see current-tenant.context.tsx for
// why it exists) is likewise centralized at the layout level, not
// re-created per screen.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <CurrentTenantProvider>
        <ErpShell>{children}</ErpShell>
      </CurrentTenantProvider>
    </ProtectedRoute>
  );
}
