"use client";

import { useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { useCurrentCompany } from "@/hooks/use-current-company";
import { CompanyContextBar } from "../components/CompanyContextBar";
import { TrialBalanceTab } from "../components/TrialBalanceTab";
import { ProfitAndLossTab } from "../components/ProfitAndLossTab";
import { BalanceSheetTab } from "../components/BalanceSheetTab";
import { CashFlowTab } from "../components/CashFlowTab";
import { ClosingReadinessTab } from "../components/ClosingReadinessTab";

type ReportTab = "trial-balance" | "profit-and-loss" | "balance-sheet" | "cash-flow" | "closing-readiness";

// Financial Reports — Trial Balance (Ch.24), Profit & Loss (Ch.25),
// Balance Sheet (Ch.26), Cash Flow (Ch.27), and a read-only Financial
// Closing readiness check (Ch.32). All five are derived, read-only views
// over the existing Ledger/Chart of Accounts data — no report here
// creates/updates/deletes/posts/approves/closes anything. Mirrors
// ChartOfAccountsScreen.tsx's own Tabs pattern (its closest analog: one
// route hosting several related, Company-scoped read views).
export function ReportsScreen() {
  const { companyUuid } = useCurrentCompany();
  const [tab, setTab] = useState<ReportTab>("trial-balance");

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Trial Balance, Profit & Loss, Balance Sheet, Cash Flow, and Financial Closing readiness."
      />
      <CompanyContextBar />

      {companyUuid && (
        <Tabs value={tab} onChange={(value) => setTab(value as ReportTab)}>
          <TabList>
            <Tab value="trial-balance">Trial Balance</Tab>
            <Tab value="profit-and-loss">Profit &amp; Loss</Tab>
            <Tab value="balance-sheet">Balance Sheet</Tab>
            <Tab value="cash-flow">Cash Flow</Tab>
            <Tab value="closing-readiness">Closing Readiness</Tab>
          </TabList>
          <TabPanel value="trial-balance">
            <TrialBalanceTab companyUuid={companyUuid} />
          </TabPanel>
          <TabPanel value="profit-and-loss">
            <ProfitAndLossTab companyUuid={companyUuid} />
          </TabPanel>
          <TabPanel value="balance-sheet">
            <BalanceSheetTab companyUuid={companyUuid} />
          </TabPanel>
          <TabPanel value="cash-flow">
            <CashFlowTab companyUuid={companyUuid} />
          </TabPanel>
          <TabPanel value="closing-readiness">
            <ClosingReadinessTab companyUuid={companyUuid} />
          </TabPanel>
        </Tabs>
      )}
    </div>
  );
}
