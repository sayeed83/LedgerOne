"use client";

import { BuildingIcon, Card, CardContent } from "@ledgerone/ui";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { CompanySelect } from "./CompanySelect";

// Every Company-scoped Inventory entity (Unit of Measure, and future
// Product Category/Product) shares this one bar instead of re-wiring a
// Company picker per screen — reads/writes the existing, shared
// CurrentCompanyContext (STATE-003), mirroring Accounting's own
// CompanyContextBar.tsx exactly. Reuses the existing CurrentCompanyProvider
// (already mounted at the app shell level) — no new provider.
export function CompanyContextBar() {
  const { companyUuid, setCompanyUuid } = useCurrentCompany();

  return (
    <Card className="mb-6">
      <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-end sm:gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
          <BuildingIcon className="h-5 w-5" />
        </span>
        <div className="w-full max-w-sm">
          <CompanySelect
            label="Active Company"
            value={companyUuid ?? ""}
            onChange={(value) => setCompanyUuid(value || null)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
