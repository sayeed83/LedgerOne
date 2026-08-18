"use client";

import { Controller, useFieldArray, useWatch, type Control, type FieldErrors } from "react-hook-form";
import { Badge, Button, TextInput, TrashIcon } from "@ledgerone/ui";
import type { JournalEntryFormValues } from "../schemas/journal-entry.schema";
import { AccountPicker } from "./AccountPicker";

export interface JournalLineGridProps {
  companyUuid: string;
  control: Control<JournalEntryFormValues>;
  errors: FieldErrors<JournalEntryFormValues>;
  disabled?: boolean;
}

const EMPTY_LINE = { accountUuid: "", debitAmount: "", creditAmount: "" };

function sum(values: (string | undefined)[]): number {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

// The header+line-items grid this milestone's brief calls for: per-line
// Account picker, debit/credit amount inputs, a running total, and a
// balanced-entry indicator (client convenience only — the backend's own
// ACC_JOURNAL_ENTRY_NOT_BALANCED is the real enforcement, FP4).
export function JournalLineGrid({ companyUuid, control, errors, disabled = false }: JournalLineGridProps) {
  const { fields, append, remove } = useFieldArray({ control, name: "lines" });
  const lines = useWatch({ control, name: "lines" }) ?? [];

  const totalDebit = sum(lines.map((line) => line.debitAmount));
  const totalCredit = sum(lines.map((line) => line.creditAmount));
  const isBalanced = lines.length >= 2 && totalDebit > 0 && totalDebit === totalCredit;

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl border border-surface-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-white/[0.02] text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-3 py-2.5">Account</th>
              <th className="w-40 px-3 py-2.5">Debit</th>
              <th className="w-40 px-3 py-2.5">Credit</th>
              <th className="w-12 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b border-surface-border last:border-0">
                <td className="px-3 py-2 align-top">
                  <Controller
                    name={`lines.${index}.accountUuid`}
                    control={control}
                    render={({ field: accountField }) => (
                      <AccountPicker
                        companyUuid={companyUuid}
                        value={accountField.value}
                        onChange={accountField.onChange}
                        label=""
                        postingOnly
                        error={errors.lines?.[index]?.accountUuid?.message}
                      />
                    )}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <Controller
                    name={`lines.${index}.debitAmount`}
                    control={control}
                    render={({ field: debitField }) => (
                      <TextInput
                        label=""
                        placeholder="0.00"
                        disabled={disabled}
                        error={errors.lines?.[index]?.debitAmount?.message}
                        {...debitField}
                      />
                    )}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <Controller
                    name={`lines.${index}.creditAmount`}
                    control={control}
                    render={({ field: creditField }) => (
                      <TextInput label="" placeholder="0.00" disabled={disabled} {...creditField} />
                    )}
                  />
                </td>
                <td className="px-3 py-2 align-top">
                  <button
                    type="button"
                    aria-label="Remove line"
                    disabled={disabled || fields.length <= 2}
                    onClick={() => remove(index)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!disabled && (
        <Button type="button" variant="secondary" size="sm" onClick={() => append(EMPTY_LINE)} className="self-start">
          Add Line
        </Button>
      )}

      {typeof errors.lines?.message === "string" && (
        <p className="text-xs text-danger-600 dark:text-danger-400">{errors.lines.message}</p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-6 rounded-xl border border-surface-border bg-white/[0.02] px-4 py-3 text-sm">
        <span>
          Total Debit: <span className="font-semibold text-ink">{totalDebit.toFixed(2)}</span>
        </span>
        <span>
          Total Credit: <span className="font-semibold text-ink">{totalCredit.toFixed(2)}</span>
        </span>
        <Badge variant={isBalanced ? "success" : "warning"}>{isBalanced ? "Balanced" : "Not Balanced"}</Badge>
      </div>
    </div>
  );
}
