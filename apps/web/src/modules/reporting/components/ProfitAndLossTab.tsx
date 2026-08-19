"use client";

import { useState } from "react";
import { Alert, Badge, Card, CardContent, TextInput } from "@ledgerone/ui";
import { Toolbar } from "@/components/ui/Toolbar";
import { useProfitAndLoss } from "../hooks/use-reports";
import { FinancialYearSelect } from "./FinancialYearSelect";
import { FiscalPeriodSelect } from "./FiscalPeriodSelect";
import { ReportGroupTree } from "./ReportGroupTree";
import { getReportingErrorMessage } from "../utils/reporting-error-messages";

// Profit & Loss (00_BUSINESS_RULES.md Ch.25) — a period-window report with
// no sensible default: the caller must supply a Fiscal Period, a Financial
// Year, or an explicit `dateFrom`+`dateTo` pair (`ACC_REPORT_SCOPE_REQUIRED`
// otherwise, enforced by `useProfitAndLoss`'s own `enabled` gate — this
// screen never fires the request until one scope is actually chosen).
export function ProfitAndLossTab({ companyUuid }: { companyUuid: string }) {
  const [financialYearUuid, setFinancialYearUuid] = useState("");
  const [fiscalPeriodUuid, setFiscalPeriodUuid] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const hasScope = Boolean(fiscalPeriodUuid || financialYearUuid || (dateFrom && dateTo));

  const profitAndLossQuery = useProfitAndLoss(
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

      {hasScope && profitAndLossQuery.isLoading && (
        <Card>
          <CardContent className="pt-6 text-sm text-ink-muted">Loading Profit &amp; Loss…</CardContent>
        </Card>
      )}

      {hasScope && profitAndLossQuery.isError && (
        <Alert variant="error" message={getReportingErrorMessage(profitAndLossQuery.error) ?? "Failed to load Profit & Loss."} />
      )}

      {profitAndLossQuery.data && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-6 pt-6 text-sm">
              <span>
                Period:{" "}
                <span className="font-semibold text-ink">
                  {profitAndLossQuery.data.periodStart.slice(0, 10)} – {profitAndLossQuery.data.periodEnd.slice(0, 10)}
                </span>
              </span>
              <span>
                Net Profit: <span className="font-semibold text-ink">{profitAndLossQuery.data.netProfit}</span>
              </span>
              {profitAndLossQuery.data.isProvisional && <Badge variant="warning">Provisional</Badge>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-3 text-sm font-semibold text-ink">Revenue</h3>
              <ReportGroupTree
                groups={profitAndLossQuery.data.revenue.groups}
                total={profitAndLossQuery.data.revenue.total}
                totalLabel="Total Revenue"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-3 text-sm font-semibold text-ink">Expenses</h3>
              <ReportGroupTree
                groups={profitAndLossQuery.data.expenses.groups}
                total={profitAndLossQuery.data.expenses.total}
                totalLabel="Total Expenses"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
