"use client";

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "ledgerone.currentCompanyUuid";

export interface CurrentCompanyContextValue {
  companyUuid: string | null;
  setCompanyUuid: (companyUuid: string | null) => void;
}

// STATE-003: cross-cutting client state (which Company the Accounting
// module is currently working with) via React Context, not a global-store
// library — mirrors current-tenant.context.tsx's own rationale. Almost
// every Accounting entity (Financial Year, Tax Group, Account Group, Chart
// of Accounts, Journal Entries) is scoped by `companyUuid`; persisting the
// operator's active Company client-side (not a secret, same FSEC-004
// reasoning as the Tenant context) avoids re-selecting it on every screen.
export const CurrentCompanyContext = createContext<CurrentCompanyContextValue | null>(null);

export function CurrentCompanyProvider({ children }: { children: ReactNode }) {
  const [companyUuid, setCompanyUuidState] = useState<string | null>(null);

  useEffect(() => {
    setCompanyUuidState(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  const setCompanyUuid = useCallback((next: string | null) => {
    setCompanyUuidState(next);
    if (next) {
      window.localStorage.setItem(STORAGE_KEY, next);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <CurrentCompanyContext.Provider value={{ companyUuid, setCompanyUuid }}>
      {children}
    </CurrentCompanyContext.Provider>
  );
}
