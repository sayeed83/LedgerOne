"use client";

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "ledgerone.currentTenantUuid";

export interface CurrentTenantContextValue {
  tenantUuid: string | null;
  setTenantUuid: (tenantUuid: string | null) => void;
}

// STATE-003: cross-cutting client state (which Tenant the Organization
// module is currently working with) via React Context, not a global-store
// library. Handbook Deviation, flagged not guessed: 07_REST_API_STANDARDS.md
// API-004/API-005 expect the active tenant to be derived automatically from
// the JWT and injected by `api-client.ts`, but the Organization module's own
// `X-Tenant-Id` header predates that middleware and is validated as a raw
// UUID (`tenant-id-header.schema.ts`) with no session-derived source and no
// `GET /tenants` list endpoint to discover one from. Until a real
// tenant-resolution endpoint exists, the tenant UUID is entered once by the
// operator (e.g. after creating or locating their Tenant) and persisted
// client-side (not a secret — a Tenant's own identifier — so `localStorage`
// is an acceptable, non-FSEC-004 use) for the rest of the session.
export const CurrentTenantContext = createContext<CurrentTenantContextValue | null>(null);

export function CurrentTenantProvider({ children }: { children: ReactNode }) {
  const [tenantUuid, setTenantUuidState] = useState<string | null>(null);

  useEffect(() => {
    setTenantUuidState(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  const setTenantUuid = useCallback((next: string | null) => {
    setTenantUuidState(next);
    if (next) {
      window.localStorage.setItem(STORAGE_KEY, next);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return (
    <CurrentTenantContext.Provider value={{ tenantUuid, setTenantUuid }}>{children}</CurrentTenantContext.Provider>
  );
}
