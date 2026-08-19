"use client";

import { useState } from "react";
import { Alert, Badge, Card, CardContent, TextInput } from "@ledgerone/ui";
import { Toolbar } from "@/components/ui/Toolbar";
import { useBalanceSheet } from "../hooks/use-reports";
import { FinancialYearSelect } from "./FinancialYearSelect";
import { FiscalPeriodSelect } from "./FiscalPeriodSelect";
import { ReportGroupTree } from "./ReportGroupTree";
import { getReportingErrorMessage } from "../utils/reporting-error-messages";

// Balance Sheet (00_BUSINESS_RULES.md Ch.26) — a point-in-time report, same
// scope shape as Trial Balance (`asOfDate`, or a Fiscal Period/Financial
// Year end date, defaulting to "now" when none is supplied — never a
// scope-required error, unlike Profit & Loss/Cash Flow).
export function BalanceSheetTab({ companyUuid }: { companyUuid: string }) {
  const [financialYearUuid, setFinancialYearUuid] = useState("");
  const [fiscalPeriodUuid, setFiscalPeriodUuid] = useState("");
  const [asOfDate, setAsOfDate] = useState("");

  const balanceSheetQuery = useBalanceSheet({
    companyUuid,
    asOfDate: asOfDate || undefined,
    fiscalPeriodUuid: fiscalPeriodUuid || undefined,
    financialYearUuid: financialYearUuid || undefined,
  });

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
              label="As Of Date"
              type="date"
              value={asOfDate}
              disabled={Boolean(fiscalPeriodUuid || financialYearUuid)}
              onChange={(event) => setAsOfDate(event.target.value)}
            />
          </div>
        }
      />

      {balanceSheetQuery.isLoading && (
        <Card>
          <CardContent className="pt-6 text-sm text-ink-muted">Loading Balance Sheet…</CardContent>
        </Card>
      )}

      {balanceSheetQuery.isError && (
        <Alert variant="error" message={getReportingErrorMessage(balanceSheetQuery.error) ?? "Failed to load Balance Sheet."} />
      )}

      {balanceSheetQuery.data && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-6 pt-6 text-sm">
              <span>
                As Of: <span className="font-semibold text-ink">{balanceSheetQuery.data.asOfDate.slice(0, 10)}</span>
              </span>
              <span>
                Current Year Earnings:{" "}
                <span className="font-semibold text-ink">{balanceSheetQuery.data.currentYearEarnings}</span>
              </span>
              <Badge variant={balanceSheetQuery.data.isBalanced ? "success" : "danger"}>
                {balanceSheetQuery.data.isBalanced ? "Balanced" : "Not Balanced"}
              </Badge>
              {balanceSheetQuery.data.isProvisional && <Badge variant="warning">Provisional</Badge>}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-3 text-sm font-semibold text-ink">Assets</h3>
              <ReportGroupTree
                groups={balanceSheetQuery.data.assets.groups}
                total={balanceSheetQuery.data.assets.total}
                totalLabel="Total Assets"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-3 text-sm font-semibold text-ink">Liabilities</h3>
              <ReportGroupTree
                groups={balanceSheetQuery.data.liabilities.groups}
                total={balanceSheetQuery.data.liabilities.total}
                totalLabel="Total Liabilities"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-3 text-sm font-semibold text-ink">Equity</h3>
              <ReportGroupTree
                groups={balanceSheetQuery.data.equity.groups}
                total={balanceSheetQuery.data.equity.total}
                totalLabel="Total Equity"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
