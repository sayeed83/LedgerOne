import { DashboardHomeScreen } from "@/modules/dashboard/screens/DashboardHomeScreen";

// FLD-001: thin routing shim only — the real screen lives in
// modules/dashboard/screens/.
export default function DashboardHomePage() {
  return <DashboardHomeScreen />;
}
