"use client";

import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import type { ReportAccountBalanceDto } from "@ledgerone/shared-types";
import { Alert, Badge, Card, CardContent, Checkbox, ListIcon, LoadingButton, TextInput } from "@ledgerone/ui";
import { Toolbar } from "@/components/ui/Toolbar";
import { DataTable } from "@/components/data/DataTable";
import { useTrialBalance } from "../hooks/use-reports";
import { FinancialYearSelect } from "./FinancialYearSelect";
import { FiscalPeriodSelect } from "./FiscalPeriodSelect";
import { getReportingErrorMessage } from "../utils/reporting-error-messages";

const columnHelper = createColumnHelper<ReportAccountBalanceDto>();

// Trial Balance (00_BUSINESS_RULES.md Ch.24) — a point-in-time report:
// `asOfDate`, or a Fiscal Period/Financial Year end date resolved from a
// picker, with "now" as the implicit fallback when none is supplied
// (`resolve-report-scope.service.ts`'s own documented default). Cursor-
// paginated (the only report that is — TRB rows can be genuinely large on
// a busy Chart of Accounts), mirroring `LedgerScreen.tsx`'s own
// "Load more" affordance rather than the small-dataset `Pagination`
// primitive.
export function TrialBalanceTab({ companyUuid }: { companyUuid: string }) {
  const [financialYearUuid, setFinancialYearUuid] = useState("");
  const [fiscalPeriodUuid, setFiscalPeriodUuid] = useState("");
  const [asOfDate, setAsOfDate] = useState("");
  const [includeZeroActivity, setIncludeZeroActivity] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [accumulatedRows, setAccumulatedRows] = useState<ReportAccountBalanceDto[]>([]);

  const trialBalanceQuery = useTrialBalance({
    companyUuid,
    asOfDate: asOfDate || undefined,
    fiscalPeriodUuid: fiscalPeriodUuid || undefined,
    financialYearUuid: financialYearUuid || undefined,
    includeZeroActivity,
    cursor,
  });

  const rows = cursor ? [...accumulatedRows, ...(trialBalanceQuery.data?.data.rows ?? [])] : trialBalanceQuery.data?.data.rows ?? [];

  function resetAndSearch() {
    setCursor(undefined);
    setAccumulatedRows([]);
  }

  function loadMore() {
    if (trialBalanceQuery.data?.data.rows) {
      setAccumulatedRows((prev) => [...prev, ...trialBalanceQuery.data!.data.rows]);
    }
    setCursor(trialBalanceQuery.data?.pagination.nextCursor ?? undefined);
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => `${row.account.code} — ${row.account.name}`, {
        id: "account",
        header: "Account",
      }),
      columnHelper.accessor("account.accountType", { header: "Type" }),
      columnHelper.accessor("totalDebit", { header: "Debit" }),
      columnHelper.accessor("totalCredit", { header: "Credit" }),
      columnHelper.accessor("balance", { header: "Balance" }),
    ],
    [],
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
                resetAndSearch();
              }}
            />
            <FiscalPeriodSelect
              financialYearUuid={financialYearUuid}
              value={fiscalPeriodUuid}
              onChange={(value) => {
                setFiscalPeriodUuid(value);
                resetAndSearch();
              }}
            />
            <TextInput
              label="As Of Date"
              type="date"
              value={asOfDate}
              disabled={Boolean(fiscalPeriodUuid || financialYearUuid)}
              onChange={(event) => {
                setAsOfDate(event.target.value);
                resetAndSearch();
              }}
            />
            <Checkbox
              label="Include zero-activity Accounts"
              checked={includeZeroActivity}
              onChange={(event) => {
                setIncludeZeroActivity(event.target.checked);
                resetAndSearch();
              }}
            />
          </div>
        }
      />

      {trialBalanceQuery.data && (
        <Card className="mb-4">
          <CardContent className="flex flex-wrap items-center gap-6 pt-6 text-sm">
            <span>
              As Of: <span className="font-semibold text-ink">{trialBalanceQuery.data.data.asOfDate.slice(0, 10)}</span>
            </span>
            <span>
              Total Debit: <span className="font-semibold text-ink">{trialBalanceQuery.data.data.totalDebit}</span>
            </span>
            <span>
              Total Credit: <span className="font-semibold text-ink">{trialBalanceQuery.data.data.totalCredit}</span>
            </span>
            <Badge variant={trialBalanceQuery.data.data.isBalanced ? "success" : "danger"}>
              {trialBalanceQuery.data.data.isBalanced ? "Balanced" : "Not Balanced"}
            </Badge>
            {trialBalanceQuery.data.data.isProvisional && <Badge variant="warning">Provisional</Badge>}
          </CardContent>
        </Card>
      )}

      {trialBalanceQuery.isLoading && !cursor ? (
        <Card>
          <CardContent className="pt-6 text-sm text-ink-muted">Loading Trial Balance…</CardContent>
        </Card>
      ) : trialBalanceQuery.isError ? (
        <Alert variant="error" message={getReportingErrorMessage(trialBalanceQuery.error) ?? "Failed to load Trial Balance."} />
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          emptyIcon={<ListIcon className="h-6 w-6" />}
          emptyTitle="No Account activity in this scope"
          getRowKey={(row) => row.account.uuid}
        />
      )}

      {trialBalanceQuery.data?.pagination.hasMore && (
        <LoadingButton
          variant="secondary"
          size="sm"
          className="mt-4"
          isLoading={trialBalanceQuery.isFetching}
          onClick={loadMore}
        >
          Load more
        </LoadingButton>
      )}
    </div>
  );
}
