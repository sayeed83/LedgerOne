"use client";

import { useState } from "react";
import { Alert, Badge, Card, CardContent } from "@ledgerone/ui";
import { Toolbar } from "@/components/ui/Toolbar";
import { useClosingReadiness } from "../hooks/use-reports";
import { FinancialYearSelect } from "./FinancialYearSelect";
import { FiscalPeriodSelect } from "./FiscalPeriodSelect";
import { getReportingErrorMessage } from "../utils/reporting-error-messages";

// Financial Closing readiness check (00_BUSINESS_RULES.md Ch.32) — a
// READ-ONLY signal only: this epic implements no posting/approving/closing
// action at all (the backend's own controller comment states this
// explicitly). `fiscalPeriodUuid` is required, not optional — unlike every
// other report here, there is no "now"/no-scope default.
export function ClosingReadinessTab({ companyUuid }: { companyUuid: string }) {
  const [financialYearUuid, setFinancialYearUuid] = useState("");
  const [fiscalPeriodUuid, setFiscalPeriodUuid] = useState("");

  const closingReadinessQuery = useClosingReadiness(
    fiscalPeriodUuid ? { companyUuid, fiscalPeriodUuid } : null,
  );

  return (
    <div>
      <Toolbar
        filters={
          <div className="flex flex-wrap items-end gap-2">
            <FinancialYearSelect
              companyUuid={companyUuid}
              value={financialYearUuid}
              onChange={(value) => {
                setFinancialYearUuid(value);
                setFiscalPeriodUuid("");
              }}
              label="Financial Year"
            />
            <FiscalPeriodSelect
              financialYearUuid={financialYearUuid}
              value={fiscalPeriodUuid}
              onChange={setFiscalPeriodUuid}
              label="Fiscal Period"
            />
          </div>
        }
      />

      {!fiscalPeriodUuid && (
        <Card>
          <CardContent className="pt-6 text-sm text-ink-muted light:text-light-ink-muted">
            Select a Financial Year, then a Fiscal Period, to check its closing readiness.
          </CardContent>
        </Card>
      )}

      {fiscalPeriodUuid && closingReadinessQuery.isLoading && (
        <Card>
          <CardContent className="pt-6 text-sm text-ink-muted light:text-light-ink-muted">Checking closing readiness…</CardContent>
        </Card>
      )}

      {fiscalPeriodUuid && closingReadinessQuery.isError && (
        <Alert
          variant="error"
          message={getReportingErrorMessage(closingReadinessQuery.error) ?? "Failed to check closing readiness."}
        />
      )}

      {closingReadinessQuery.data && (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm">
                Fiscal Period:{" "}
                <span className="font-semibold text-ink light:text-light-ink">
                  {closingReadinessQuery.data.fiscalPeriod.startDate.slice(0, 10)} –{" "}
                  {closingReadinessQuery.data.fiscalPeriod.endDate.slice(0, 10)}
                </span>
              </span>
              <Badge variant="default">{closingReadinessQuery.data.fiscalPeriod.status}</Badge>
              <Badge variant={closingReadinessQuery.data.readyToClose ? "success" : "warning"}>
                {closingReadinessQuery.data.readyToClose ? "Ready to Close" : "Not Ready"}
              </Badge>
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted light:text-light-ink-muted">Trial Balance Balanced</dt>
                <dd className="mt-1 text-sm text-ink light:text-light-ink">
                  {closingReadinessQuery.data.trialBalanceBalanced ? "Yes" : "No"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted light:text-light-ink-muted">Prior Periods Closed</dt>
                <dd className="mt-1 text-sm text-ink light:text-light-ink">
                  {closingReadinessQuery.data.priorPeriodsClosed ? "Yes" : "No"}
                </dd>
              </div>
            </dl>
            {closingReadinessQuery.data.reasons.length > 0 && (
              <div>
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted light:text-light-ink-muted">
                  Reasons Not Ready
                </h4>
                <ul className="list-inside list-disc text-sm text-ink light:text-light-ink">
                  {closingReadinessQuery.data.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
