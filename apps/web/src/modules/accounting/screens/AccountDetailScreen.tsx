"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Card, CardContent, CardHeader, CardTitle, Drawer, LayersIcon, LoadingButton, PencilIcon, Skeleton } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAccount, useActivateAccount, useDeactivateAccount, useUpdateAccount } from "../hooks/use-accounts";
import { AccountForm } from "../components/AccountForm";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

export function AccountDetailScreen() {
  const router = useRouter();
  const params = useParams<{ accountUuid: string }>();
  const accountUuid = params.accountUuid;

  const accountQuery = useAccount(accountUuid);
  const companyUuid = accountQuery.data?.companyUuid ?? "";
  const updateAccount = useUpdateAccount(companyUuid, accountUuid);
  const activateAccount = useActivateAccount(companyUuid, accountUuid);
  const deactivateAccount = useDeactivateAccount(companyUuid, accountUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Account"
        description="Chart of Accounts entry details and lifecycle."
        actions={
          <LoadingButton variant="ghost" size="sm" isLoading={false} onClick={() => router.push("/accounting/chart-of-accounts")}>
            Back to Chart of Accounts
          </LoadingButton>
        }
      />

      {accountQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
          </CardContent>
        </Card>
      )}

      {accountQuery.isError && (
        <Alert variant="error" message={getAccountingErrorMessage(accountQuery.error) ?? "Failed to load Account."} />
      )}

      {accountQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <LayersIcon className="h-5 w-5" />
              </span>
              <CardTitle>
                {accountQuery.data.code} — {accountQuery.data.name}
              </CardTitle>
              <StatusBadge status={accountQuery.data.status} />
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
              <Field label="Account Type" value={accountQuery.data.accountType} />
              <Field label="Posting Account" value={accountQuery.data.isPostingAccount ? "Yes" : "No"} />
            </dl>
            <div className="flex flex-wrap items-center gap-2 border-t border-surface-border pt-4">
              <LoadingButton
                variant="secondary"
                size="sm"
                isLoading={activateAccount.isPending}
                disabled={accountQuery.data.status === "ACTIVE"}
                onClick={() => activateAccount.mutate()}
              >
                Activate
              </LoadingButton>
              <LoadingButton
                variant="danger"
                size="sm"
                isLoading={deactivateAccount.isPending}
                disabled={accountQuery.data.status !== "ACTIVE"}
                onClick={() => deactivateAccount.mutate()}
              >
                Deactivate
              </LoadingButton>
              <LoadingButton
                variant="ghost"
                size="sm"
                isLoading={false}
                onClick={() => router.push(`/accounting/ledger?accountUuid=${accountUuid}`)}
              >
                View Ledger
              </LoadingButton>
            </div>
          </CardContent>
        </Card>
      )}

      <Drawer isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Account" description="Update this Account.">
        {accountQuery.data && (
          // Flagged known backend gap (see account.dto.ts): the Account
          // response doesn't echo back `accountGroupUuid`/`parentAccountUuid`,
          // so this edit form can't prefill them — the operator re-selects
          // the Account Group (and parent, if any) on every edit.
          <AccountForm
            isEditing
            companyUuid={accountQuery.data.companyUuid}
            excludeAccountUuid={accountUuid}
            defaultValues={{
              companyUuid: accountQuery.data.companyUuid,
              code: accountQuery.data.code,
              name: accountQuery.data.name,
              accountType: accountQuery.data.accountType,
              accountGroupUuid: "",
              parentAccountUuid: "",
              isPostingAccount: accountQuery.data.isPostingAccount,
            }}
            isSubmitting={updateAccount.isPending}
            serverError={getAccountingErrorMessage(updateAccount.error)}
            fieldErrors={updateAccount.error?.details}
            onSubmit={(values) =>
              updateAccount.mutate(
                {
                  name: values.name,
                  accountGroupUuid: values.accountGroupUuid,
                  parentAccountUuid: values.parentAccountUuid || null,
                  isPostingAccount: values.isPostingAccount,
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
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}
