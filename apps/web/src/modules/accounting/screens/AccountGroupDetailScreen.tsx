"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Card, CardContent, CardHeader, CardTitle, Drawer, LayersIcon, LoadingButton, PencilIcon, Skeleton } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAccountGroup, useUpdateAccountGroup } from "../hooks/use-account-groups";
import { AccountGroupForm } from "../components/AccountGroupForm";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

export function AccountGroupDetailScreen() {
  const router = useRouter();
  const params = useParams<{ accountGroupUuid: string }>();
  const accountGroupUuid = params.accountGroupUuid;

  const accountGroupQuery = useAccountGroup(accountGroupUuid);
  const companyUuid = accountGroupQuery.data?.companyUuid ?? "";
  const updateAccountGroup = useUpdateAccountGroup(companyUuid, accountGroupUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Account Group"
        description="Account Group details."
        actions={
          <LoadingButton variant="ghost" size="sm" isLoading={false} onClick={() => router.push("/accounting/chart-of-accounts")}>
            Back to Chart of Accounts
          </LoadingButton>
        }
      />

      {accountGroupQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
          </CardContent>
        </Card>
      )}

      {accountGroupQuery.isError && (
        <Alert variant="error" message={getAccountingErrorMessage(accountGroupQuery.error) ?? "Failed to load Account Group."} />
      )}

      {accountGroupQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <LayersIcon className="h-5 w-5" />
              </span>
              <CardTitle>{accountGroupQuery.data.name}</CardTitle>
            </div>
            <LoadingButton
              variant="secondary"
              size="sm"
              isLoading={false}
              leadingIcon={<PencilIcon className="h-4 w-4" />}
              onClick={() => setIsEditOpen(true)}
            >
              Edit
            </LoadingButton>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Account Type" value={accountGroupQuery.data.accountType} />
            </dl>
          </CardContent>
        </Card>
      )}

      <Drawer isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Account Group" description="Update this Account Group.">
        {accountGroupQuery.data && (
          // Flagged known backend gap (see account-group.dto.ts): the
          // response doesn't echo back `parentAccountGroupUuid`, so this
          // edit form can't prefill it.
          <AccountGroupForm
            isEditing
            excludeAccountGroupUuid={accountGroupUuid}
            defaultValues={{
              companyUuid: accountGroupQuery.data.companyUuid,
              name: accountGroupQuery.data.name,
              accountType: accountGroupQuery.data.accountType,
              parentAccountGroupUuid: "",
            }}
            isSubmitting={updateAccountGroup.isPending}
            serverError={getAccountingErrorMessage(updateAccountGroup.error)}
            fieldErrors={updateAccountGroup.error?.details}
            onSubmit={(values) =>
              updateAccountGroup.mutate(
                {
                  name: values.name,
                  accountType: values.accountType,
                  parentAccountGroupUuid: values.parentAccountGroupUuid || null,
                },
                { onSuccess: () => setIsEditOpen(false) },
              )
            }
          />
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
