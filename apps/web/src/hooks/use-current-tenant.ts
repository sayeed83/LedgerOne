import { useContext } from "react";
import { CurrentTenantContext, type CurrentTenantContextValue } from "@/context/current-tenant.context";

export function useCurrentTenant(): CurrentTenantContextValue {
  const context = useContext(CurrentTenantContext);
  if (!context) {
    throw new Error("useCurrentTenant must be used within a CurrentTenantProvider.");
  }
  return context;
}
