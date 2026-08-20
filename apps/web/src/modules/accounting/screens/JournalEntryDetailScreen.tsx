"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { JournalEntryLineResponseDto } from "@ledgerone/shared-types";
import {
  Alert,
  BookOpenIcon,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Drawer,
  LoadingButton,
  PencilIcon,
  Skeleton,
  Textarea,
  TextInput,
} from "@ledgerone/ui";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable } from "@/components/data/DataTable";
import {
  useJournalEntry,
  usePostJournalEntry,
  useRejectJournalEntry,
  useReverseJournalEntry,
  useSubmitJournalEntry,
  useUpdateJournalEntry,
} from "../hooks/use-journal-entries";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

const columnHelper = createColumnHelper<JournalEntryLineResponseDto>();

export function JournalEntryDetailScreen() {
  const router = useRouter();
  const params = useParams<{ journalEntryUuid: string }>();
  const journalEntryUuid = params.journalEntryUuid;

  const journalEntryQuery = useJournalEntry(journalEntryUuid);
  const companyUuid = journalEntryQuery.data?.companyUuid ?? "";
  const updateJournalEntry = useUpdateJournalEntry(companyUuid, journalEntryUuid);
  const submitJournalEntry = useSubmitJournalEntry(companyUuid, journalEntryUuid);
  const rejectJournalEntry = useRejectJournalEntry(companyUuid, journalEntryUuid);
  const postJournalEntry = usePostJournalEntry(companyUuid, journalEntryUuid);
  const reverseJournalEntry = useReverseJournalEntry(companyUuid, journalEntryUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"post" | "reverse" | "reject" | null>(null);

  const status = journalEntryQuery.data?.status;
  const totalDebit = (journalEntryQuery.data?.lines ?? []).reduce((sum, line) => sum + Number(line.debitAmount), 0);
  const totalCredit = (journalEntryQuery.data?.lines ?? []).reduce((sum, line) => sum + Number(line.creditAmount), 0);

  const columns = useMemo(
    () => [
      columnHelper.accessor("debitAmount", { header: "Debit" }),
      columnHelper.accessor("creditAmount", { header: "Credit" }),
    ],
    [],
  );

  const confirmConfig = {
    post: {
      title: "Post this Journal Entry?",
      description: "Posting commits this entry to the Ledger. This cannot be undone directly — use Reverse instead.",
      confirmLabel: "Post",
      run: () => postJournalEntry.mutate(),
      isPending: postJournalEntry.isPending,
    },
    reverse: {
      title: "Reverse this Journal Entry?",
      description: "This creates an offsetting reversal. This action cannot be undone.",
      confirmLabel: "Reverse",
      run: () => reverseJournalEntry.mutate(),
      isPending: reverseJournalEntry.isPending,
    },
    reject: {
      title: "Reject this Journal Entry?",
      description: "This sends the entry back for revision.",
      confirmLabel: "Reject",
      run: () => rejectJournalEntry.mutate(),
      isPending: rejectJournalEntry.isPending,
    },
  } as const;

  return (
    <div>
      <PageHeader
        title="Journal Entry"
        description="Journal Entry header, lines, and workflow."
        actions={
          <LoadingButton
            variant="ghost"
            size="sm"
            isLoading={false}
            onClick={() => router.push("/accounting/journal-entries")}
          >
            Back to Journal Entries
          </LoadingButton>
        }
      />

      {journalEntryQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
          </CardContent>
        </Card>
      )}

      {journalEntryQuery.isError && (
        <Alert variant="error" message={getAccountingErrorMessage(journalEntryQuery.error) ?? "Failed to load Journal Entry."} />
      )}

      {journalEntryQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <BookOpenIcon className="h-5 w-5" />
              </span>
              <CardTitle>{journalEntryQuery.data.postingDate}</CardTitle>
              <StatusBadge status={journalEntryQuery.data.status} />
            </div>
            <LoadingButton
              variant="secondary"
              size="sm"
              isLoading={false}
              leadingIcon={<PencilIcon className="h-4 w-4" />}
              disabled={status !== "DRAFT"}
              onClick={() => setIsEditOpen(true)}
            >
              Edit
            </LoadingButton>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <p className="text-sm text-ink-muted light:text-light-ink-muted">{journalEntryQuery.data.narration ?? "No narration."}</p>

            {/* Flagged known backend gap (see journal-entry.dto.ts): a
                line's `accountUuid` is not echoed back on read, so this
                table cannot show which Account each line posted to. */}
            <DataTable
              columns={columns}
              data={journalEntryQuery.data.lines}
              emptyTitle="No lines"
              getRowKey={(line) => line.uuid}
            />
            <div className="flex flex-wrap items-center justify-end gap-6 rounded-xl border border-surface-border light:border-light-surface-border bg-white/[0.02] light:bg-black/[0.02] px-4 py-3 text-sm">
              <span>
                Total Debit: <span className="font-semibold text-ink light:text-light-ink">{totalDebit.toFixed(2)}</span>
              </span>
              <span>
                Total Credit: <span className="font-semibold text-ink light:text-light-ink">{totalCredit.toFixed(2)}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-surface-border light:border-light-surface-border pt-4">
              <LoadingButton
                variant="secondary"
                size="sm"
                isLoading={submitJournalEntry.isPending}
                disabled={status !== "DRAFT"}
                onClick={() => submitJournalEntry.mutate()}
              >
                Submit
              </LoadingButton>
              <LoadingButton
                variant="secondary"
                size="sm"
                isLoading={false}
                disabled={status !== "PENDING_APPROVAL"}
                onClick={() => setConfirmAction("reject")}
              >
                Reject
              </LoadingButton>
              <LoadingButton
                variant="primary"
                size="sm"
                isLoading={false}
                disabled={status !== "PENDING_APPROVAL"}
                onClick={() => setConfirmAction("post")}
              >
                Post
              </LoadingButton>
              <LoadingButton
                variant="danger"
                size="sm"
                isLoading={false}
                disabled={status !== "POSTED"}
                onClick={() => setConfirmAction("reverse")}
              >
                Reverse
              </LoadingButton>
            </div>
          </CardContent>
        </Card>
      )}

      <Drawer isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Journal Entry" description="Update the posting date or narration (Draft only).">
        {journalEntryQuery.data && (
          <JournalEntryHeaderForm
            defaultValues={{
              postingDate: journalEntryQuery.data.postingDate.slice(0, 10),
              narration: journalEntryQuery.data.narration ?? "",
            }}
            isSubmitting={updateJournalEntry.isPending}
            serverError={getAccountingErrorMessage(updateJournalEntry.error)}
            onSubmit={(values) =>
              updateJournalEntry.mutate(
                { postingDate: values.postingDate, narration: values.narration || null },
                { onSuccess: () => setIsEditOpen(false) },
              )
            }
          />
        )}
      </Drawer>

      {confirmAction && (
        <ConfirmDialog
          isOpen
          onClose={() => setConfirmAction(null)}
          onConfirm={() => confirmConfig[confirmAction].run()}
          title={confirmConfig[confirmAction].title}
          description={confirmConfig[confirmAction].description}
          confirmLabel={confirmConfig[confirmAction].confirmLabel}
          isDestructive={confirmAction === "reverse" || confirmAction === "reject"}
          isConfirming={confirmConfig[confirmAction].isPending}
        />
      )}
    </div>
  );
}

interface JournalEntryHeaderFormValues {
  postingDate: string;
  narration: string;
}

function JournalEntryHeaderForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  serverError,
}: {
  defaultValues: JournalEntryHeaderFormValues;
  onSubmit: (values: JournalEntryHeaderFormValues) => void;
  isSubmitting: boolean;
  serverError?: string | null;
}) {
  const { register, handleSubmit } = useForm<JournalEntryHeaderFormValues>({ defaultValues });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
      {serverError && <Alert variant="error" message={serverError} />}
      <TextInput label="Posting Date" type="date" {...register("postingDate")} />
      <Textarea label="Narration" {...register("narration")} />
      <LoadingButton type="submit" isLoading={isSubmitting} loadingLabel="Saving…" className="w-full">
        Save
      </LoadingButton>
    </form>
  );
}
