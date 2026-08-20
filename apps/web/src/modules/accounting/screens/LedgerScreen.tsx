"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { LedgerEntryResponseDto } from "@ledgerone/shared-types";
import { AccountStatus } from "@ledgerone/shared-types";
import { Alert, Card, CardContent, Drawer, ListIcon, LoadingButton, Select, Skeleton, TextInput } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useAccountLedger, useLedgerEntry } from "../hooks/use-ledger";
import { useAccounts } from "../hooks/use-accounts";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

const columnHelper = createColumnHelper<LedgerEntryResponseDto>();

// Ledger is read-only derived data — List (pick an Account + date range),
// Transaction history with a running balance, and an entry-level drill-down
// Drawer (PAGE-002's related-data pattern). Cursor-paginated (TBL-003
// doesn't apply — this is a genuinely unbounded, growing dataset), so this
// uses a "Load more" affordance instead of the small-dataset `Pagination`
// primitive.
export function LedgerScreen() {
  const searchParams = useSearchParams();
  const { companyUuid } = useCurrentCompany();
  const [accountUuid, setAccountUuid] = useState(searchParams.get("accountUuid") ?? "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [accumulatedEntries, setAccumulatedEntries] = useState<LedgerEntryResponseDto[]>([]);
  const [selectedEntryUuid, setSelectedEntryUuid] = useState<string | null>(null);

  const accountsQuery = useAccounts(companyUuid ? { companyUuid, status: AccountStatus.Active } : undefined);
  const ledgerQuery = useAccountLedger(accountUuid || null, {
    companyUuid: companyUuid ?? undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    cursor,
  });
  const ledgerEntryQuery = useLedgerEntry(selectedEntryUuid);

  const entries = cursor ? [...accumulatedEntries, ...(ledgerQuery.data?.data.entries ?? [])] : ledgerQuery.data?.data.entries ?? [];

  function resetAndSearch() {
    setCursor(undefined);
    setAccumulatedEntries([]);
  }

  function loadMore() {
    if (ledgerQuery.data?.data.entries) {
      setAccumulatedEntries((prev) => [...prev, ...ledgerQuery.data!.data.entries]);
    }
    setCursor(ledgerQuery.data?.pagination.nextCursor ?? undefined);
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("entryDate", { header: "Date" }),
      columnHelper.accessor("debitAmount", { header: "Debit" }),
      columnHelper.accessor("creditAmount", { header: "Credit" }),
      columnHelper.accessor("runningBalance", { header: "Running Balance" }),
    ],
    [],
  );

  return (
    <div>
      <PageHeader title="Ledger" description="Browse an Account's posted transaction history." />
      <CompanyContextBar />

      {companyUuid && (
        <>
          <Toolbar
            filters={
              <div className="flex flex-wrap items-center gap-2">
                <Select
                  label="Account"
                  compact
                  value={accountUuid}
                  options={[
                    { value: "", label: "Select an account" },
                    ...(accountsQuery.data ?? []).map((account) => ({
                      value: account.uuid,
                      label: `${account.code} — ${account.name}`,
                    })),
                  ]}
                  onChange={(next) => {
                    setAccountUuid(next);
                    resetAndSearch();
                  }}
                />
                <TextInput
                  label=""
                  aria-label="Date from"
                  type="date"
                  value={dateFrom}
                  onChange={(event) => {
                    setDateFrom(event.target.value);
                    resetAndSearch();
                  }}
                />
                <TextInput
                  label=""
                  aria-label="Date to"
                  type="date"
                  value={dateTo}
                  onChange={(event) => {
                    setDateTo(event.target.value);
                    resetAndSearch();
                  }}
                />
              </div>
            }
            actions={
              // No backend export endpoint exists for Ledger — placeholder
              // per this milestone's explicit brief ("Export button
              // placeholder if backend export doesn't exist").
              <LoadingButton variant="secondary" isLoading={false} disabled title="Export is not yet available.">
                Export
              </LoadingButton>
            }
          />

          {!accountUuid && (
            <Card>
              <CardContent className="pt-6 text-sm text-ink-muted light:text-light-ink-muted">Select an Account to view its Ledger.</CardContent>
            </Card>
          )}

          {accountUuid && ledgerQuery.data && (
            <Card className="mb-4">
              <CardContent className="flex flex-wrap items-center gap-6 pt-6 text-sm">
                <span>
                  Opening Balance:{" "}
                  <span className="font-semibold text-ink light:text-light-ink">{ledgerQuery.data.data.openingBalance}</span>
                </span>
                <span>
                  Closing Balance:{" "}
                  <span className="font-semibold text-ink light:text-light-ink">{ledgerQuery.data.data.closingBalance}</span>
                </span>
              </CardContent>
            </Card>
          )}

          {accountUuid && (
            <>
              {ledgerQuery.isLoading && !cursor ? (
                <Card>
                  <CardContent className="flex flex-col gap-3 pt-6">
                    <Skeleton variant="text" className="w-1/3" />
                  </CardContent>
                </Card>
              ) : ledgerQuery.isError ? (
                <Alert variant="error" message={getAccountingErrorMessage(ledgerQuery.error) ?? "Failed to load Ledger."} />
              ) : (
                <DataTable
                  columns={columns}
                  data={entries}
                  emptyIcon={<ListIcon className="h-6 w-6" />}
                  emptyTitle="No transactions in this range"
                  emptyDescription="Try widening the date range."
                  onRowClick={(entry) => setSelectedEntryUuid(entry.uuid)}
                  getRowKey={(entry) => entry.uuid}
                />
              )}

              {ledgerQuery.data?.pagination.hasMore && (
                <LoadingButton
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  isLoading={ledgerQuery.isFetching}
                  onClick={loadMore}
                >
                  Load more
                </LoadingButton>
              )}
            </>
          )}
        </>
      )}

      <Drawer
        isOpen={Boolean(selectedEntryUuid)}
        onClose={() => setSelectedEntryUuid(null)}
        title="Ledger Entry"
        description="Drill down into the posting Journal Entry."
      >
        {ledgerEntryQuery.isLoading && <Skeleton variant="text" className="w-1/2" />}
        {ledgerEntryQuery.data && (
          <dl className="grid grid-cols-1 gap-4">
            <Field label="Entry Date" value={ledgerEntryQuery.data.entryDate} />
            <Field label="Debit" value={ledgerEntryQuery.data.debitAmount} />
            <Field label="Credit" value={ledgerEntryQuery.data.creditAmount} />
            <Field label="Journal Entry Posting Date" value={ledgerEntryQuery.data.journalEntry.postingDate} />
            <Field label="Narration" value={ledgerEntryQuery.data.journalEntry.narration ?? "—"} />
            <Field label="Journal Entry Status" value={ledgerEntryQuery.data.journalEntry.status} />
          </dl>
        )}
      </Drawer>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted light:text-light-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink light:text-light-ink">{value}</dd>
    </div>
  );
}
