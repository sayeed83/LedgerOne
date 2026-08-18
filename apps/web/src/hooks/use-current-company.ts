import { useContext } from "react";
import { CurrentCompanyContext, type CurrentCompanyContextValue } from "@/context/current-company.context";

export function useCurrentCompany(): CurrentCompanyContextValue {
  const context = useContext(CurrentCompanyContext);
  if (!context) {
    throw new Error("useCurrentCompany must be used within a CurrentCompanyProvider.");
  }
  return context;
}
