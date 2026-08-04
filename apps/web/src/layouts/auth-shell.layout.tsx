import type { ReactNode } from "react";
import { Card, CheckIcon, LedgerOneMark } from "@ledgerone/ui";

const PLATFORM_MODULES = ["Accounting", "Inventory", "Sales", "CRM", "Payroll", "Reporting"];

// LAY-001-equivalent for the Authentication surface: a professional
// two-column shell, desktop-first (RESP-001) — the branding panel is a
// deliberate adaptation on smaller screens (RESP-002/003), never redesigned
// as a separate mobile-first layout. This is route-group layout composition
// only (ROUTE-003) — no screen/business logic lives here.
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="dark min-h-screen w-full bg-surface font-sans text-ink">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        {/* Left: brand panel — hidden below md, reduced-width from md to lg (RESP-002/003) */}
        <div className="relative hidden overflow-hidden border-r border-surface-border md:flex md:flex-col md:justify-between md:px-10 md:py-12 lg:px-16 lg:py-16">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 20% 15%, rgba(37,99,235,0.22), transparent 60%), radial-gradient(50% 40% at 90% 90%, rgba(37,99,235,0.12), transparent 60%)",
            }}
            aria-hidden="true"
          />

          <div className="relative flex items-center gap-3">
            <LedgerOneMark className="h-9 w-9 shrink-0" />
            <span className="text-lg font-semibold tracking-tight text-ink">LedgerOne</span>
          </div>

          <div className="relative max-w-md">
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-ink lg:text-4xl">
              The financial operating system for growing enterprises.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-muted">
              One secure, cloud-native platform to run accounting, operations, and reporting
              across every entity you manage.
            </p>

            <ul className="mt-10 flex flex-col gap-3">
              {PLATFORM_MODULES.map((moduleName) => (
                <li key={moduleName} className="flex items-center gap-3 text-sm text-ink">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-primary-500">
                    <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
                  </span>
                  {moduleName}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative flex items-center gap-3 border-t border-surface-border pt-6">
            <span className="text-xs font-medium uppercase tracking-widest text-ink-muted">
              Trusted Enterprise ERP Platform
            </span>
          </div>
        </div>

        {/* Right: authentication card */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <LedgerOneMark className="h-8 w-8" />
            <span className="text-base font-semibold tracking-tight text-ink">LedgerOne</span>
          </div>

          <Card className="w-full max-w-[420px] p-8 sm:p-10">{children}</Card>

          <p className="mt-8 text-center text-xs text-ink-muted">
            © {new Date().getFullYear()} LedgerOne. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
