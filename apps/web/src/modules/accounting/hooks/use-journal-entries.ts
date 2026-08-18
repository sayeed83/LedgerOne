import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateJournalEntryRequestDto,
  JournalEntryResponseDto,
  ListJournalEntriesQueryDto,
  UpdateJournalEntryRequestDto,
} from "@ledgerone/shared-types";
import * as accountingService from "@/services/accounting.service";
import type { ApiError } from "@/services/api-client";

export function journalEntriesQueryKey(query?: ListJournalEntriesQueryDto) {
  return ["accounting", "journal-entries", query ?? {}] as const;
}

export function journalEntryQueryKey(journalEntryUuid: string) {
  return ["accounting", "journal-entry", journalEntryUuid] as const;
}

export function useJournalEntries(query?: ListJournalEntriesQueryDto) {
  return useQuery<JournalEntryResponseDto[], ApiError>({
    queryKey: journalEntriesQueryKey(query),
    queryFn: () => accountingService.listJournalEntries(query),
    enabled: Boolean(query?.companyUuid),
  });
}

export function useJournalEntry(journalEntryUuid: string | null) {
  return useQuery<JournalEntryResponseDto, ApiError>({
    queryKey: journalEntryQueryKey(journalEntryUuid ?? ""),
    queryFn: () => accountingService.getJournalEntry(journalEntryUuid as string),
    enabled: Boolean(journalEntryUuid),
  });
}

export function useCreateJournalEntry(companyUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<JournalEntryResponseDto, ApiError, CreateJournalEntryRequestDto>({
    mutationFn: (payload) => accountingService.createJournalEntry(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["accounting", "journal-entries", { companyUuid }] }),
  });
}

export function useUpdateJournalEntry(companyUuid: string, journalEntryUuid: string) {
  const queryClient = useQueryClient();
  return useMutation<JournalEntryResponseDto, ApiError, UpdateJournalEntryRequestDto>({
    mutationFn: (payload) => accountingService.updateJournalEntry(journalEntryUuid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalEntryQueryKey(journalEntryUuid) });
      queryClient.invalidateQueries({ queryKey: ["accounting", "journal-entries", { companyUuid }] });
    },
  });
}

function useJournalEntryTransition(
  companyUuid: string,
  journalEntryUuid: string,
  action: (uuid: string) => Promise<JournalEntryResponseDto>,
) {
  const queryClient = useQueryClient();
  return useMutation<JournalEntryResponseDto, ApiError, void>({
    mutationFn: () => action(journalEntryUuid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalEntryQueryKey(journalEntryUuid) });
      queryClient.invalidateQueries({ queryKey: ["accounting", "journal-entries", { companyUuid }] });
    },
  });
}

export function useSubmitJournalEntry(companyUuid: string, journalEntryUuid: string) {
  return useJournalEntryTransition(companyUuid, journalEntryUuid, accountingService.submitJournalEntry);
}

export function useRejectJournalEntry(companyUuid: string, journalEntryUuid: string) {
  return useJournalEntryTransition(companyUuid, journalEntryUuid, accountingService.rejectJournalEntry);
}

export function usePostJournalEntry(companyUuid: string, journalEntryUuid: string) {
  return useJournalEntryTransition(companyUuid, journalEntryUuid, accountingService.postJournalEntry);
}

export function useReverseJournalEntry(companyUuid: string, journalEntryUuid: string) {
  return useJournalEntryTransition(companyUuid, journalEntryUuid, accountingService.reverseJournalEntry);
}
