"use client";

import { useParams, useRouter } from "next/navigation";
import { Alert, ArrowsRightLeftIcon, Card, CardContent, CardHeader, CardTitle, LoadingButton, Skeleton } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { useExchangeRate } from "../hooks/use-exchange-rates";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

// Exchange Rates are immutable — this Detail screen is read-only (no
// Edit/lifecycle actions), mirroring the backend's create/get/list-only
// surface.
export function ExchangeRateDetailScreen() {
  const router = useRouter();
  const params = useParams<{ exchangeRateUuid: string }>();
  const exchangeRateQuery = useExchangeRate(params.exchangeRateUuid);

  return (
    <div>
      <PageHeader
        title="Exchange Rate"
        description="Exchange Rate detail. Exchange Rates are immutable once created."
        actions={
          <LoadingButton variant="ghost" size="sm" isLoading={false} onClick={() => router.push("/accounting/exchange-rates")}>
            Back to Exchange Rates
          </LoadingButton>
        }
      />

      {exchangeRateQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-1/2" />
          </CardContent>
        </Card>
      )}

      {exchangeRateQuery.isError && (
        <Alert variant="error" message={getAccountingErrorMessage(exchangeRateQuery.error) ?? "Failed to load Exchange Rate."} />
      )}

      {exchangeRateQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
              <ArrowsRightLeftIcon className="h-5 w-5" />
            </span>
            <CardTitle>Rate {exchangeRateQuery.data.rate}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Rate" value={exchangeRateQuery.data.rate} />
              <Field label="Effective Date" value={exchangeRateQuery.data.effectiveDate} />
            </dl>
          </CardContent>
        </Card>
      )}
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
