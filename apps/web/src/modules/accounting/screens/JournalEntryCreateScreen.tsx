"use client";

import { useRouter } from "next/navigation";
import { LoadingButton } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { useCreateJournalEntry } from "../hooks/use-journal-entries";
import { JournalEntryForm } from "../components/JournalEntryForm";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

export function JournalEntryCreateScreen() {
  const router = useRouter();
  const { companyUuid } = useCurrentCompany();
  const createJournalEntry = useCreateJournalEntry(companyUuid ?? "");

  return (
    <div>
      <PageHeader
        title="New Journal Entry"
        description="Post a balanced Journal Entry as a Draft."
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
      <CompanyContextBar />

      {companyUuid && (
        <JournalEntryForm
          companyUuid={companyUuid}
          submitLabel="Save Draft"
          isSubmitting={createJournalEntry.isPending}
          serverError={getAccountingErrorMessage(createJournalEntry.error)}
          fieldErrors={createJournalEntry.error?.details}
          onSubmit={(values) =>
            createJournalEntry.mutate(
              {
                companyUuid: values.companyUuid,
                postingDate: values.postingDate,
                narration: values.narration || undefined,
                lines: values.lines.map((line) => ({
                  accountUuid: line.accountUuid,
                  debitAmount: line.debitAmount || "0",
                  creditAmount: line.creditAmount || "0",
                })),
              },
              {
                onSuccess: (entry) => router.push(`/accounting/journal-entries/${entry.uuid}`),
              },
            )
          }
        />
      )}
    </div>
  );
}
