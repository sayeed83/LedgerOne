"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Drawer,
  ListIcon,
  LoadingButton,
  PencilIcon,
  Skeleton,
} from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCustomer } from "../hooks/use-customer";
import { useUpdateCustomer } from "../hooks/use-update-customer";
import { CustomerForm } from "../components/CustomerForm";
import { getSalesErrorMessage } from "../utils/sales-error-messages";

// Mirrors ProductDetailScreen.tsx's exact pattern.
export function CustomerDetailScreen() {
  const router = useRouter();
  const params = useParams<{ customerUuid: string }>();
  const customerUuid = params.customerUuid;

  const customerQuery = useCustomer(customerUuid);
  const companyUuid = customerQuery.data?.companyUuid ?? "";
  const updateCustomer = useUpdateCustomer(companyUuid, customerUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Customer"
        description="Customer details."
        actions={
          <LoadingButton variant="ghost" size="sm" isLoading={false} onClick={() => router.push("/customers")}>
            Back to Customers
          </LoadingButton>
        }
      />

      {customerQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
          </CardContent>
        </Card>
      )}

      {customerQuery.isError && (
        <Alert variant="error" message={getSalesErrorMessage(customerQuery.error) ?? "Failed to load Customer."} />
      )}

      {customerQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <ListIcon className="h-5 w-5" />
              </span>
              <CardTitle>{customerQuery.data.name}</CardTitle>
              <StatusBadge status={customerQuery.data.status} />
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
              <Field label="Address Line 1" value={customerQuery.data.addressLine1 ?? "—"} />
              <Field label="Address Line 2" value={customerQuery.data.addressLine2 ?? "—"} />
              <Field label="City" value={customerQuery.data.city ?? "—"} />
              <Field label="Region" value={customerQuery.data.region ?? "—"} />
              <Field label="Postal Code" value={customerQuery.data.postalCode ?? "—"} />
              <Field label="Country" value={customerQuery.data.countryCode ?? "—"} />
              <Field label="Credit Limit" value={customerQuery.data.creditLimit} />
              <Field label="Payment Terms" value={customerQuery.data.paymentTerms ?? "—"} />
            </dl>
          </CardContent>
        </Card>
      )}

      <Drawer isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Customer" description="Update this Customer.">
        {customerQuery.data && (
          <CustomerForm
            isEditing
            companyUuid={customerQuery.data.companyUuid}
            defaultValues={{
              companyUuid: customerQuery.data.companyUuid,
              name: customerQuery.data.name,
              addressLine1: customerQuery.data.addressLine1 ?? "",
              addressLine2: customerQuery.data.addressLine2 ?? "",
              city: customerQuery.data.city ?? "",
              region: customerQuery.data.region ?? "",
              postalCode: customerQuery.data.postalCode ?? "",
              countryCode: customerQuery.data.countryCode ?? "",
              creditLimit: customerQuery.data.creditLimit,
              paymentTerms: customerQuery.data.paymentTerms ?? "",
              status: customerQuery.data.status,
            }}
            isSubmitting={updateCustomer.isPending}
            serverError={getSalesErrorMessage(updateCustomer.error)}
            fieldErrors={updateCustomer.error?.details}
            onSubmit={(values) =>
              updateCustomer.mutate(
                {
                  name: values.name,
                  addressLine1: values.addressLine1 || null,
                  addressLine2: values.addressLine2 || null,
                  city: values.city || null,
                  region: values.region || null,
                  postalCode: values.postalCode || null,
                  countryCode: values.countryCode || null,
                  creditLimit: values.creditLimit,
                  paymentTerms: values.paymentTerms || null,
                  status: values.status,
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
