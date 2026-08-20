"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Alert, Card, CardContent, CardHeader, CardTitle, CoinsIcon, Drawer, LoadingButton, PencilIcon, Skeleton } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useActivateCurrency, useCurrency, useDeactivateCurrency, useUpdateCurrency } from "../hooks/use-currencies";
import { CurrencyForm } from "../components/CurrencyForm";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

export function CurrencyDetailScreen() {
  const router = useRouter();
  const params = useParams<{ currencyUuid: string }>();
  const currencyUuid = params.currencyUuid;

  const currencyQuery = useCurrency(currencyUuid);
  const updateCurrency = useUpdateCurrency(currencyUuid);
  const activateCurrency = useActivateCurrency(currencyUuid);
  const deactivateCurrency = useDeactivateCurrency(currencyUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Currency"
        description="Currency details and lifecycle."
        actions={
          <LoadingButton variant="ghost" size="sm" isLoading={false} onClick={() => router.push("/accounting/currencies")}>
            Back to Currencies
          </LoadingButton>
        }
      />

      {currencyQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-1/2" />
          </CardContent>
        </Card>
      )}

      {currencyQuery.isError && (
        <Alert variant="error" message={getAccountingErrorMessage(currencyQuery.error) ?? "Failed to load Currency."} />
      )}

      {currencyQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <CoinsIcon className="h-5 w-5" />
              </span>
              <CardTitle>
                {currencyQuery.data.isoCode} — {currencyQuery.data.name}
              </CardTitle>
              <StatusBadge status={currencyQuery.data.status} />
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
              <Field label="Symbol" value={currencyQuery.data.symbol} />
              <Field label="Decimal Precision" value={String(currencyQuery.data.decimalPrecision)} />
            </dl>
            <div className="flex flex-wrap items-center gap-2 border-t border-surface-border light:border-light-surface-border pt-4">
              <LoadingButton
                variant="secondary"
                size="sm"
                isLoading={activateCurrency.isPending}
                disabled={currencyQuery.data.status === "ACTIVE"}
                onClick={() => activateCurrency.mutate()}
              >
                Activate
              </LoadingButton>
              <LoadingButton
                variant="danger"
                size="sm"
                isLoading={deactivateCurrency.isPending}
                disabled={currencyQuery.data.status !== "ACTIVE"}
                onClick={() => deactivateCurrency.mutate()}
              >
                Deactivate
              </LoadingButton>
            </div>
          </CardContent>
        </Card>
      )}

      <Drawer isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Currency" description="Update this Currency's display details.">
        {currencyQuery.data && (
          <CurrencyForm
            isEditing
            defaultValues={{
              isoCode: currencyQuery.data.isoCode,
              name: currencyQuery.data.name,
              symbol: currencyQuery.data.symbol,
              decimalPrecision: currencyQuery.data.decimalPrecision,
            }}
            isSubmitting={updateCurrency.isPending}
            serverError={getAccountingErrorMessage(updateCurrency.error)}
            fieldErrors={updateCurrency.error?.details}
            onSubmit={(values) =>
              updateCurrency.mutate(
                { name: values.name, symbol: values.symbol, decimalPrecision: values.decimalPrecision },
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
