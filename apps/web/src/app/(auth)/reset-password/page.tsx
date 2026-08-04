import { Suspense } from "react";
import { ResetPasswordScreen } from "@/modules/authentication/screens/ResetPasswordScreen";

// useSearchParams (reading `tenantId`/`token` from the reset link) requires
// a Suspense boundary in the App Router.
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordScreen />
    </Suspense>
  );
}
