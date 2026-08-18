"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import { CurrencyStatus, type ExchangeRateResponseDto } from "@ledgerone/shared-types";
import { ArrowsRightLeftIcon, Drawer, LoadingButton, PlusIcon, Select } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { Toolbar } from "@/components/ui/Toolbar";
import { Pagination } from "@/components/ui/Pagination";
import { DataTable } from "@/components/data/DataTable";
import { useCreateExchangeRate, useExchangeRates } from "../hooks/use-exchange-rates";
import { useCurrencies } from "../hooks/use-currencies";
import { ExchangeRateForm } from "../components/ExchangeRateForm";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<ExchangeRateResponseDto>();

export function ExchangeRateScreen() {
  const router = useRouter();
  const [fromCurrencyUuid, setFromCurrencyUuid] = useState("");
  const [toCurrencyUuid, setToCurrencyUuid] = useState("");
  const exchangeRatesQuery = useExchangeRates({
    fromCurrencyUuid: fromCurrencyUuid || undefined,
    toCurrencyUuid: toCurrencyUuid || undefined,
  });
  const currenciesQuery = useCurrencies(CurrencyStatus.Active);
  const createExchangeRate = useCreateExchangeRate();

  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const currencyOptions = currenciesQuery.data ?? [];
  const data = exchangeRatesQuery.data ?? [];
  const paged = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = useMemo(
    () => [
      columnHelper.accessor("rate", { header: "Rate" }),
      columnHelper.accessor("effectiveDate", { header: "Effective Date" }),
    ],
    [],
  );

  return (
    <div>
      <PageHeader title="Exchange Rates" description="Record Currency exchange rates. Exchange Rates are immutable once created." />
      <Toolbar
        filters={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              label="From Currency"
              compact
              value={fromCurrencyUuid}
              options={[
                { value: "", label: "All From Currencies" },
                ...currencyOptions.map((currency) => ({ value: currency.uuid, label: currency.isoCode })),
              ]}
              onChange={setFromCurrencyUuid}
            />
            <Select
              label="To Currency"
              compact
              value={toCurrencyUuid}
              options={[
                { value: "", label: "All To Currencies" },
                ...currencyOptions.map((currency) => ({ value: currency.uuid, label: currency.isoCode })),
              ]}
              onChange={setToCurrencyUuid}
            />
          </div>
        }
        actions={
          <LoadingButton isLoading={false} leadingIcon={<PlusIcon className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            New Exchange Rate
          </LoadingButton>
        }
      />

      <DataTable
        columns={columns}
        data={paged}
        isLoading={exchangeRatesQuery.isLoading}
        isError={exchangeRatesQuery.isError}
        errorMessage={getAccountingErrorMessage(exchangeRatesQuery.error)}
        emptyIcon={<ArrowsRightLeftIcon className="h-6 w-6" />}
        emptyTitle="No Exchange Rates yet"
        emptyDescription="Record your first Exchange Rate to get started."
        emptyAction={
          <LoadingButton isLoading={false} onClick={() => setIsCreateOpen(true)}>
            New Exchange Rate
          </LoadingButton>
        }
        onRowClick={(rate) => router.push(`/accounting/exchange-rates/${rate.uuid}`)}
        getRowKey={(rate) => rate.uuid}
      />
      <Pagination page={page} pageSize={PAGE_SIZE} totalItems={data.length} onPageChange={setPage} />

      <Drawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New Exchange Rate"
        description="Record a new Currency exchange rate. This cannot be edited later."
      >
        <ExchangeRateForm
          isSubmitting={createExchangeRate.isPending}
          serverError={getAccountingErrorMessage(createExchangeRate.error)}
          fieldErrors={createExchangeRate.error?.details}
          onSubmit={(values) => createExchangeRate.mutate(values, { onSuccess: () => setIsCreateOpen(false) })}
        />
      </Drawer>
    </div>
  );
}
