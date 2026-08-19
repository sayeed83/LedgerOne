import type {
  AccountLedgerResponseDto,
  AccountResponseDto,
  AccountGroupResponseDto,
  BalanceSheetQueryDto,
  BalanceSheetResponseDto,
  CashFlowQueryDto,
  CashFlowResponseDto,
  ClosingReadinessQueryDto,
  ClosingReadinessResponseDto,
  CreateAccountGroupRequestDto,
  CreateAccountRequestDto,
  CreateCurrencyRequestDto,
  CreateExchangeRateRequestDto,
  CreateFinancialYearRequestDto,
  CreateFiscalPeriodRequestDto,
  CreateJournalEntryRequestDto,
  CreateTaxGroupRequestDto,
  CreateTaxRuleRequestDto,
  CurrencyResponseDto,
  CursorPaginationMetaDto,
  ExchangeRateResponseDto,
  FinancialYearResponseDto,
  FiscalPeriodResponseDto,
  JournalEntryResponseDto,
  LedgerEntryDetailResponseDto,
  ListAccountsQueryDto,
  ListExchangeRatesQueryDto,
  ListJournalEntriesQueryDto,
  ListLedgerQueryDto,
  ProfitAndLossQueryDto,
  ProfitAndLossResponseDto,
  TaxGroupResponseDto,
  TaxRuleResponseDto,
  TrialBalanceQueryDto,
  TrialBalanceResponseDto,
  UpdateAccountGroupRequestDto,
  UpdateAccountRequestDto,
  UpdateCurrencyRequestDto,
  UpdateFinancialYearRequestDto,
  UpdateFiscalPeriodRequestDto,
  UpdateJournalEntryRequestDto,
  UpdateTaxGroupRequestDto,
} from "@ledgerone/shared-types";
import { apiClient } from "./api-client";

interface Envelope<T> {
  data: T;
}

interface PaginatedEnvelope<T> {
  data: T;
  meta: { pagination: CursorPaginationMetaDto };
}

// FLD-004/API-002/ARCH-003: the sole API wrapper for the Accounting module.
// API-004: the active tenant is derived from the JWT by
// `current-tenant.middleware.ts` server-side — unlike Organization's
// pre-JWT-tenancy module, no `X-Tenant-Id` header is set by this file.
// `companyUuid` below is a legitimate request field (which Company an
// Accounting entity belongs to), not the tenant-context concept API-004
// forbids passing explicitly.

// --- Financial Years ---

export async function listFinancialYears(companyUuid?: string): Promise<FinancialYearResponseDto[]> {
  const response = await apiClient.get<Envelope<FinancialYearResponseDto[]>>("/accounting/financial-years", {
    params: companyUuid ? { companyUuid } : undefined,
  });
  return response.data.data;
}

export async function getFinancialYear(financialYearUuid: string): Promise<FinancialYearResponseDto> {
  const response = await apiClient.get<Envelope<FinancialYearResponseDto>>(
    `/accounting/financial-years/${financialYearUuid}`,
  );
  return response.data.data;
}

export async function createFinancialYear(
  payload: CreateFinancialYearRequestDto,
): Promise<FinancialYearResponseDto> {
  const response = await apiClient.post<Envelope<FinancialYearResponseDto>>(
    "/accounting/financial-years",
    payload,
  );
  return response.data.data;
}

export async function updateFinancialYear(
  financialYearUuid: string,
  payload: UpdateFinancialYearRequestDto,
): Promise<FinancialYearResponseDto> {
  const response = await apiClient.put<Envelope<FinancialYearResponseDto>>(
    `/accounting/financial-years/${financialYearUuid}`,
    payload,
  );
  return response.data.data;
}

async function financialYearTransition(
  financialYearUuid: string,
  action: "open" | "close" | "reopen",
): Promise<FinancialYearResponseDto> {
  const response = await apiClient.post<Envelope<FinancialYearResponseDto>>(
    `/accounting/financial-years/${financialYearUuid}/${action}`,
  );
  return response.data.data;
}

export const openFinancialYear = (uuid: string) => financialYearTransition(uuid, "open");
export const closeFinancialYear = (uuid: string) => financialYearTransition(uuid, "close");
export const reopenFinancialYear = (uuid: string) => financialYearTransition(uuid, "reopen");

// --- Fiscal Periods ---

export async function listFiscalPeriods(financialYearUuid: string): Promise<FiscalPeriodResponseDto[]> {
  const response = await apiClient.get<Envelope<FiscalPeriodResponseDto[]>>("/accounting/fiscal-periods", {
    params: { financialYearUuid },
  });
  return response.data.data;
}

export async function getFiscalPeriod(fiscalPeriodUuid: string): Promise<FiscalPeriodResponseDto> {
  const response = await apiClient.get<Envelope<FiscalPeriodResponseDto>>(
    `/accounting/fiscal-periods/${fiscalPeriodUuid}`,
  );
  return response.data.data;
}

export async function createFiscalPeriod(
  payload: CreateFiscalPeriodRequestDto,
): Promise<FiscalPeriodResponseDto> {
  const response = await apiClient.post<Envelope<FiscalPeriodResponseDto>>(
    "/accounting/fiscal-periods",
    payload,
  );
  return response.data.data;
}

export async function updateFiscalPeriod(
  fiscalPeriodUuid: string,
  payload: UpdateFiscalPeriodRequestDto,
): Promise<FiscalPeriodResponseDto> {
  const response = await apiClient.put<Envelope<FiscalPeriodResponseDto>>(
    `/accounting/fiscal-periods/${fiscalPeriodUuid}`,
    payload,
  );
  return response.data.data;
}

async function fiscalPeriodTransition(
  fiscalPeriodUuid: string,
  action: "soft-close" | "close" | "reopen",
): Promise<FiscalPeriodResponseDto> {
  const response = await apiClient.post<Envelope<FiscalPeriodResponseDto>>(
    `/accounting/fiscal-periods/${fiscalPeriodUuid}/${action}`,
  );
  return response.data.data;
}

export const softCloseFiscalPeriod = (uuid: string) => fiscalPeriodTransition(uuid, "soft-close");
export const closeFiscalPeriod = (uuid: string) => fiscalPeriodTransition(uuid, "close");
export const reopenFiscalPeriod = (uuid: string) => fiscalPeriodTransition(uuid, "reopen");

// --- Currencies (platform-owned, no company scoping) ---

export async function listCurrencies(status?: "ACTIVE" | "INACTIVE"): Promise<CurrencyResponseDto[]> {
  const response = await apiClient.get<Envelope<CurrencyResponseDto[]>>("/accounting/currencies", {
    params: status ? { status } : undefined,
  });
  return response.data.data;
}

export async function getCurrency(currencyUuid: string): Promise<CurrencyResponseDto> {
  const response = await apiClient.get<Envelope<CurrencyResponseDto>>(`/accounting/currencies/${currencyUuid}`);
  return response.data.data;
}

export async function createCurrency(payload: CreateCurrencyRequestDto): Promise<CurrencyResponseDto> {
  const response = await apiClient.post<Envelope<CurrencyResponseDto>>("/accounting/currencies", payload);
  return response.data.data;
}

export async function updateCurrency(
  currencyUuid: string,
  payload: UpdateCurrencyRequestDto,
): Promise<CurrencyResponseDto> {
  const response = await apiClient.put<Envelope<CurrencyResponseDto>>(
    `/accounting/currencies/${currencyUuid}`,
    payload,
  );
  return response.data.data;
}

async function currencyTransition(
  currencyUuid: string,
  action: "activate" | "deactivate",
): Promise<CurrencyResponseDto> {
  const response = await apiClient.post<Envelope<CurrencyResponseDto>>(
    `/accounting/currencies/${currencyUuid}/${action}`,
  );
  return response.data.data;
}

export const activateCurrency = (uuid: string) => currencyTransition(uuid, "activate");
export const deactivateCurrency = (uuid: string) => currencyTransition(uuid, "deactivate");

// --- Exchange Rates (tenant-owned, immutable) ---

export async function listExchangeRates(query?: ListExchangeRatesQueryDto): Promise<ExchangeRateResponseDto[]> {
  const response = await apiClient.get<Envelope<ExchangeRateResponseDto[]>>("/accounting/exchange-rates", {
    params: query,
  });
  return response.data.data;
}

export async function getExchangeRate(exchangeRateUuid: string): Promise<ExchangeRateResponseDto> {
  const response = await apiClient.get<Envelope<ExchangeRateResponseDto>>(
    `/accounting/exchange-rates/${exchangeRateUuid}`,
  );
  return response.data.data;
}

export async function createExchangeRate(
  payload: CreateExchangeRateRequestDto,
): Promise<ExchangeRateResponseDto> {
  const response = await apiClient.post<Envelope<ExchangeRateResponseDto>>(
    "/accounting/exchange-rates",
    payload,
  );
  return response.data.data;
}

// --- Tax Groups ---

export async function listTaxGroups(companyUuid?: string): Promise<TaxGroupResponseDto[]> {
  const response = await apiClient.get<Envelope<TaxGroupResponseDto[]>>("/accounting/tax-groups", {
    params: companyUuid ? { companyUuid } : undefined,
  });
  return response.data.data;
}

export async function getTaxGroup(taxGroupUuid: string): Promise<TaxGroupResponseDto> {
  const response = await apiClient.get<Envelope<TaxGroupResponseDto>>(`/accounting/tax-groups/${taxGroupUuid}`);
  return response.data.data;
}

export async function createTaxGroup(payload: CreateTaxGroupRequestDto): Promise<TaxGroupResponseDto> {
  const response = await apiClient.post<Envelope<TaxGroupResponseDto>>("/accounting/tax-groups", payload);
  return response.data.data;
}

export async function updateTaxGroup(
  taxGroupUuid: string,
  payload: UpdateTaxGroupRequestDto,
): Promise<TaxGroupResponseDto> {
  const response = await apiClient.put<Envelope<TaxGroupResponseDto>>(
    `/accounting/tax-groups/${taxGroupUuid}`,
    payload,
  );
  return response.data.data;
}

// --- Tax Rules (immutable) ---

export async function listTaxRules(taxGroupUuid: string): Promise<TaxRuleResponseDto[]> {
  const response = await apiClient.get<Envelope<TaxRuleResponseDto[]>>("/accounting/tax-rules", {
    params: { taxGroupUuid },
  });
  return response.data.data;
}

export async function getTaxRule(taxRuleUuid: string): Promise<TaxRuleResponseDto> {
  const response = await apiClient.get<Envelope<TaxRuleResponseDto>>(`/accounting/tax-rules/${taxRuleUuid}`);
  return response.data.data;
}

export async function createTaxRule(payload: CreateTaxRuleRequestDto): Promise<TaxRuleResponseDto> {
  const response = await apiClient.post<Envelope<TaxRuleResponseDto>>("/accounting/tax-rules", payload);
  return response.data.data;
}

// --- Account Groups ---

export async function listAccountGroups(companyUuid?: string): Promise<AccountGroupResponseDto[]> {
  const response = await apiClient.get<Envelope<AccountGroupResponseDto[]>>("/accounting/account-groups", {
    params: companyUuid ? { companyUuid } : undefined,
  });
  return response.data.data;
}

export async function getAccountGroup(accountGroupUuid: string): Promise<AccountGroupResponseDto> {
  const response = await apiClient.get<Envelope<AccountGroupResponseDto>>(
    `/accounting/account-groups/${accountGroupUuid}`,
  );
  return response.data.data;
}

export async function createAccountGroup(
  payload: CreateAccountGroupRequestDto,
): Promise<AccountGroupResponseDto> {
  const response = await apiClient.post<Envelope<AccountGroupResponseDto>>(
    "/accounting/account-groups",
    payload,
  );
  return response.data.data;
}

export async function updateAccountGroup(
  accountGroupUuid: string,
  payload: UpdateAccountGroupRequestDto,
): Promise<AccountGroupResponseDto> {
  const response = await apiClient.put<Envelope<AccountGroupResponseDto>>(
    `/accounting/account-groups/${accountGroupUuid}`,
    payload,
  );
  return response.data.data;
}

// --- Chart of Accounts (Accounts) ---

export async function listAccounts(query?: ListAccountsQueryDto): Promise<AccountResponseDto[]> {
  const response = await apiClient.get<Envelope<AccountResponseDto[]>>("/accounting/accounts", {
    params: query,
  });
  return response.data.data;
}

export async function getAccount(accountUuid: string): Promise<AccountResponseDto> {
  const response = await apiClient.get<Envelope<AccountResponseDto>>(`/accounting/accounts/${accountUuid}`);
  return response.data.data;
}

export async function createAccount(payload: CreateAccountRequestDto): Promise<AccountResponseDto> {
  const response = await apiClient.post<Envelope<AccountResponseDto>>("/accounting/accounts", payload);
  return response.data.data;
}

export async function updateAccount(
  accountUuid: string,
  payload: UpdateAccountRequestDto,
): Promise<AccountResponseDto> {
  const response = await apiClient.put<Envelope<AccountResponseDto>>(
    `/accounting/accounts/${accountUuid}`,
    payload,
  );
  return response.data.data;
}

async function accountTransition(
  accountUuid: string,
  action: "activate" | "deactivate",
): Promise<AccountResponseDto> {
  const response = await apiClient.post<Envelope<AccountResponseDto>>(
    `/accounting/accounts/${accountUuid}/${action}`,
  );
  return response.data.data;
}

export const activateAccount = (uuid: string) => accountTransition(uuid, "activate");
export const deactivateAccount = (uuid: string) => accountTransition(uuid, "deactivate");

// --- Journal Entries ---

export async function listJournalEntries(
  query?: ListJournalEntriesQueryDto,
): Promise<JournalEntryResponseDto[]> {
  const response = await apiClient.get<Envelope<JournalEntryResponseDto[]>>("/accounting/journal-entries", {
    params: query,
  });
  return response.data.data;
}

export async function getJournalEntry(journalEntryUuid: string): Promise<JournalEntryResponseDto> {
  const response = await apiClient.get<Envelope<JournalEntryResponseDto>>(
    `/accounting/journal-entries/${journalEntryUuid}`,
  );
  return response.data.data;
}

export async function createJournalEntry(
  payload: CreateJournalEntryRequestDto,
): Promise<JournalEntryResponseDto> {
  const response = await apiClient.post<Envelope<JournalEntryResponseDto>>(
    "/accounting/journal-entries",
    payload,
  );
  return response.data.data;
}

export async function updateJournalEntry(
  journalEntryUuid: string,
  payload: UpdateJournalEntryRequestDto,
): Promise<JournalEntryResponseDto> {
  const response = await apiClient.put<Envelope<JournalEntryResponseDto>>(
    `/accounting/journal-entries/${journalEntryUuid}`,
    payload,
  );
  return response.data.data;
}

async function journalEntryTransition(
  journalEntryUuid: string,
  action: "submit" | "reject" | "post" | "reverse",
): Promise<JournalEntryResponseDto> {
  const response = await apiClient.post<Envelope<JournalEntryResponseDto>>(
    `/accounting/journal-entries/${journalEntryUuid}/${action}`,
  );
  return response.data.data;
}

export const submitJournalEntry = (uuid: string) => journalEntryTransition(uuid, "submit");
export const rejectJournalEntry = (uuid: string) => journalEntryTransition(uuid, "reject");
export const postJournalEntry = (uuid: string) => journalEntryTransition(uuid, "post");
export const reverseJournalEntry = (uuid: string) => journalEntryTransition(uuid, "reverse");

// --- Ledger (read-only) ---

export interface AccountLedgerResult {
  data: AccountLedgerResponseDto;
  pagination: CursorPaginationMetaDto;
}

export async function getAccountLedger(
  accountUuid: string,
  query?: Omit<ListLedgerQueryDto, "accountUuid">,
): Promise<AccountLedgerResult> {
  const response = await apiClient.get<PaginatedEnvelope<AccountLedgerResponseDto>>(
    `/accounting/ledger/accounts/${accountUuid}`,
    { params: query },
  );
  return { data: response.data.data, pagination: response.data.meta.pagination };
}

export async function getLedgerEntry(ledgerEntryUuid: string): Promise<LedgerEntryDetailResponseDto> {
  const response = await apiClient.get<Envelope<LedgerEntryDetailResponseDto>>(
    `/accounting/ledger/entries/${ledgerEntryUuid}`,
  );
  return response.data.data;
}

// --- Financial Reports (read-only — Trial Balance Ch.24, P&L Ch.25,
// Balance Sheet Ch.26, Cash Flow Ch.27, Financial Closing readiness check
// Ch.32; no create/update/delete endpoint exists for any of these, they are
// derived views over the existing Ledger/Chart of Accounts data) ---

export interface TrialBalanceResult {
  data: TrialBalanceResponseDto;
  pagination: CursorPaginationMetaDto;
}

export async function getTrialBalance(query: TrialBalanceQueryDto): Promise<TrialBalanceResult> {
  const response = await apiClient.get<PaginatedEnvelope<TrialBalanceResponseDto>>(
    "/accounting/reports/trial-balance",
    { params: query },
  );
  return { data: response.data.data, pagination: response.data.meta.pagination };
}

export async function getBalanceSheet(query: BalanceSheetQueryDto): Promise<BalanceSheetResponseDto> {
  const response = await apiClient.get<Envelope<BalanceSheetResponseDto>>("/accounting/reports/balance-sheet", {
    params: query,
  });
  return response.data.data;
}

export async function getProfitAndLoss(query: ProfitAndLossQueryDto): Promise<ProfitAndLossResponseDto> {
  const response = await apiClient.get<Envelope<ProfitAndLossResponseDto>>(
    "/accounting/reports/profit-and-loss",
    { params: query },
  );
  return response.data.data;
}

export async function getCashFlow(query: CashFlowQueryDto): Promise<CashFlowResponseDto> {
  const response = await apiClient.get<Envelope<CashFlowResponseDto>>("/accounting/reports/cash-flow", {
    params: query,
  });
  return response.data.data;
}

export async function getClosingReadiness(query: ClosingReadinessQueryDto): Promise<ClosingReadinessResponseDto> {
  const response = await apiClient.get<Envelope<ClosingReadinessResponseDto>>(
    "/accounting/reports/closing-readiness",
    { params: query },
  );
  return response.data.data;
}
