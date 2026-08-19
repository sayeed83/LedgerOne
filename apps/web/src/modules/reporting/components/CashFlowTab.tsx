"use client";

import { useState } from "react";
import { Alert, Badge, Card, CardContent, TextInput } from "@ledgerone/ui";
import { Toolbar } from "@/components/ui/Toolbar";
import { useCashFlow } from "../hooks/use-reports";
import { FinancialYearSelect } from "./FinancialYearSelect";
import { FiscalPeriodSelect } from "./FiscalPeriodSelect";
import { getReportingErrorMessage } from "../utils/reporting-error-messages";

// Cash Flow (00_BUSINESS_RULES.md Ch.27), simplified indirect method — the
// backend surfaces one reconciling "Operating Activities" figure rather
// than a genuine Operating/Investing/Financing three-way split (a
// documented Architectural Risk on the backend, not a frontend omission —
// this screen renders exactly the shape the API returns, no more). Same
// period-scope-required gating as Profit & Loss (Ch.27 shares the identical
// `resolvePeriodScope` on the backend).
export function CashFlowTab({ companyUuid }: { companyUuid: string }) {
  const [financialYearUuid, setFinancialYearUuid] = useState("");
  const [fiscalPeriodUuid, setFiscalPeriodUuid] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const hasScope = Boolean(fiscalPeriodUuid || financialYearUuid || (dateFrom && dateTo));

  const cashFlowQuery = useCashFlow(
    hasScope
      ? {
          companyUuid,
          fiscalPeriodUuid: fiscalPeriodUuid || undefined,
          financialYearUuid: financialYearUuid || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        }
      : null,
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
            />
            <FiscalPeriodSelect
              financialYearUuid={financialYearUuid}
              value={fiscalPeriodUuid}
              onChange={setFiscalPeriodUuid}
            />
            <TextInput
              label="Date From"
              type="date"
              value={dateFrom}
              disabled={Boolean(fiscalPeriodUuid || financialYearUuid)}
              onChange={(event) => setDateFrom(event.target.value)}
            />
            <TextInput
              label="Date To"
              type="date"
              value={dateTo}
              disabled={Boolean(fiscalPeriodUuid || financialYearUuid)}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </div>
        }
      />

      {!hasScope && (
        <Card>
          <CardContent className="pt-6 text-sm text-ink-muted">
            Select a Fiscal Period, a Financial Year, or a date range to run this report.
          </CardContent>
        </Card>
      )}

      {hasScope && cashFlowQuery.isLoading && (
        <Card>
          <CardContent className="pt-6 text-sm text-ink-muted">Loading Cash Flow…</CardContent>
        </Card>
      )}

      {hasScope && cashFlowQuery.isError && (
        <Alert variant="error" message={getReportingErrorMessage(cashFlowQuery.error) ?? "Failed to load Cash Flow."} />
      )}

      {cashFlowQuery.data && (
        <Card>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm">
                Period:{" "}
                <span className="font-semibold text-ink">
                  {cashFlowQuery.data.periodStart.slice(0, 10)} – {cashFlowQuery.data.periodEnd.slice(0, 10)}
                </span>
              </span>
              {cashFlowQuery.data.isProvisional && <Badge variant="warning">Provisional</Badge>}
              <Badge variant={cashFlowQuery.data.reconciles ? "success" : "danger"}>
                {cashFlowQuery.data.reconciles ? "Reconciles" : "Does Not Reconcile"}
              </Badge>
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Net Profit" value={cashFlowQuery.data.netProfit} />
              <Field label="Operating Adjustment" value={cashFlowQuery.data.operatingAdjustment} />
              <Field label="Net Cash Flow" value={cashFlowQuery.data.netCashFlow} />
              <Field label="Actual Cash Change" value={cashFlowQuery.data.actualCashChange} />
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}
