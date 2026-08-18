"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createColumnHelper } from "@tanstack/react-table";
import type { TaxRuleResponseDto } from "@ledgerone/shared-types";
import { Alert, Card, CardContent, CardHeader, CardTitle, Drawer, LoadingButton, PencilIcon, PercentIcon, PlusIcon, Skeleton } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/data/DataTable";
import { useTaxGroup, useUpdateTaxGroup } from "../hooks/use-tax-groups";
import { useCreateTaxRule, useTaxRules } from "../hooks/use-tax-rules";
import { TaxGroupForm } from "../components/TaxGroupForm";
import { TaxRuleForm } from "../components/TaxRuleForm";
import { getAccountingErrorMessage } from "../utils/accounting-error-messages";

const columnHelper = createColumnHelper<TaxRuleResponseDto>();

export function TaxGroupDetailScreen() {
  const router = useRouter();
  const params = useParams<{ taxGroupUuid: string }>();
  const taxGroupUuid = params.taxGroupUuid;

  const taxGroupQuery = useTaxGroup(taxGroupUuid);
  const companyUuid = taxGroupQuery.data?.companyUuid ?? "";
  const updateTaxGroup = useUpdateTaxGroup(companyUuid, taxGroupUuid);

  const taxRulesQuery = useTaxRules(taxGroupUuid);
  const createTaxRule = useCreateTaxRule(taxGroupUuid);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);

  const columns = useMemo(
    () => [
      columnHelper.accessor("rate", { header: "Rate (%)" }),
      columnHelper.accessor("effectiveFrom", { header: "Effective From" }),
      columnHelper.accessor("effectiveTo", { header: "Effective To", cell: (info) => info.getValue() ?? "—" }),
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Tax Group"
        description="Tax Group details and Tax Rules."
        actions={
          <LoadingButton variant="ghost" size="sm" isLoading={false} onClick={() => router.push("/accounting/tax")}>
            Back to Tax Groups
          </LoadingButton>
        }
      />

      {taxGroupQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
          </CardContent>
        </Card>
      )}

      {taxGroupQuery.isError && (
        <Alert variant="error" message={getAccountingErrorMessage(taxGroupQuery.error) ?? "Failed to load Tax Group."} />
      )}

      {taxGroupQuery.data && (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <PercentIcon className="h-5 w-5" />
              </span>
              <CardTitle>{taxGroupQuery.data.name}</CardTitle>
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
        </Card>
      )}

      <div className="mt-8">
        <PageHeader
          title="Tax Rules"
          description="Tax Rules are immutable once created."
          actions={
            <LoadingButton isLoading={false} leadingIcon={<PlusIcon className="h-4 w-4" />} onClick={() => setIsCreateRuleOpen(true)}>
              New Tax Rule
            </LoadingButton>
          }
        />
        <DataTable
          columns={columns}
          data={taxRulesQuery.data ?? []}
          isLoading={taxRulesQuery.isLoading}
          isError={taxRulesQuery.isError}
          errorMessage={getAccountingErrorMessage(taxRulesQuery.error)}
          emptyIcon={<PercentIcon className="h-6 w-6" />}
          emptyTitle="No Tax Rules yet"
          emptyDescription="Create the first Tax Rule for this Tax Group."
          emptyAction={
            <LoadingButton isLoading={false} onClick={() => setIsCreateRuleOpen(true)}>
              New Tax Rule
            </LoadingButton>
          }
          getRowKey={(rule) => rule.uuid}
        />
      </div>

      <Drawer isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Tax Group" description="Update this Tax Group's name.">
        {taxGroupQuery.data && (
          <TaxGroupForm
            isEditing
            defaultValues={{ companyUuid: taxGroupQuery.data.companyUuid, name: taxGroupQuery.data.name }}
            isSubmitting={updateTaxGroup.isPending}
            serverError={getAccountingErrorMessage(updateTaxGroup.error)}
            fieldErrors={updateTaxGroup.error?.details}
            onSubmit={(values) => updateTaxGroup.mutate({ name: values.name }, { onSuccess: () => setIsEditOpen(false) })}
          />
        )}
      </Drawer>

      <Drawer isOpen={isCreateRuleOpen} onClose={() => setIsCreateRuleOpen(false)} title="New Tax Rule" description="Add a Tax Rule to this Tax Group.">
        <TaxRuleForm
          taxGroupUuid={taxGroupUuid}
          isSubmitting={createTaxRule.isPending}
          serverError={getAccountingErrorMessage(createTaxRule.error)}
          fieldErrors={createTaxRule.error?.details}
          onSubmit={(values) => createTaxRule.mutate(values, { onSuccess: () => setIsCreateRuleOpen(false) })}
        />
      </Drawer>
    </div>
  );
}
