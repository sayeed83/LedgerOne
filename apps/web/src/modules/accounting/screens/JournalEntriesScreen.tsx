"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import { JournalEntryStatus, type JournalEntryResponseDto } from "@ledgerone/shared-types";
import { BookOpenIcon, LoadingButton, PlusIcon, Select } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { SearchBox } from "@/components/ui/SearchBox";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useJournalEntries } from "../hooks/use-journal-entries";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<JournalEntryResponseDto>();

export function JournalEntriesScreen() {
  const router = useRouter();
  const { companyUuid } = useCurrentCompany();
  const [statusFilter, setStatusFilter] = useState<JournalEntryStatus | undefined>(undefined);
  const journalEntriesQuery = useJournalEntries(
    companyUuid ? { companyUuid, status: statusFilter } : undefined,
  );

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const entries = journalEntriesQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) {
      return entries;
    }
    return entries.filter(
      (entry) => entry.postingDate.includes(term) || (entry.narration ?? "").toLowerCase().includes(term),
    );
  }, [journalEntriesQuery.data, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("postingDate", { header: "Posting Date" }),
      columnHelper.accessor("narration", { header: "Narration", cell: (info) => info.getValue() ?? "—" }),
      columnHelper.accessor((entry) => entry.lines.length, { id: "lineCount", header: "Lines" }),
      columnHelper.accessor("status", { header: "Status", cell: (info) => <StatusBadge status={info.getValue()} /> }),
    ],
    [],
  );

  return (
    <div>
      <PageHeader title="Journal Entries" description="Create and manage Journal Entries." />
      <CompanyContextBar />

      {companyUuid && (
        <>
          <Toolbar
            filters={
              <Select
                label="Status"
                compact
                value={statusFilter ?? ""}
                options={[
                  { value: "", label: "All statuses" },
                  { value: JournalEntryStatus.Draft, label: "Draft" },
                  { value: JournalEntryStatus.PendingApproval, label: "Pending Approval" },
                  { value: JournalEntryStatus.Posted, label: "Posted" },
                  { value: JournalEntryStatus.Reversed, label: "Reversed" },
                ]}
                onChange={(next) => setStatusFilter((next || undefined) as JournalEntryStatus | undefined)}
              />
            }
            actions={
              <LoadingButton
                isLoading={false}
                leadingIcon={<PlusIcon className="h-4 w-4" />}
                onClick={() => router.push("/accounting/journal-entries/new")}
              >
                New Journal Entry
              </LoadingButton>
            }
          >
            <SearchBox
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search by date or narration…"
            />
          </Toolbar>

          <DataTable
            columns={columns}
            data={paged}
            isLoading={journalEntriesQuery.isLoading}
            isError={journalEntriesQuery.isError}
            errorMessage={getAccountingErrorMessage(journalEntriesQuery.error)}
            emptyIcon={<BookOpenIcon className="h-6 w-6" />}
            emptyTitle={search ? "No Journal Entries match your search" : "No Journal Entries yet"}
            emptyDescription={search ? "Try a different search term." : "Create your first Journal Entry to get started."}
            emptyAction={
              !search && (
                <LoadingButton isLoading={false} onClick={() => router.push("/accounting/journal-entries/new")}>
                  New Journal Entry
                </LoadingButton>
              )
            }
            onRowClick={(entry) => router.push(`/accounting/journal-entries/${entry.uuid}`)}
            getRowKey={(entry) => entry.uuid}
          />
          <Pagination page={page} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
