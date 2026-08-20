"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Drawer,
  LoadingButton,
  MailIcon,
  PencilIcon,
  Skeleton,
  UserIcon,
} from "@ledgerone/ui";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useUser } from "../hooks/use-user";
import { useUpdateUser } from "../hooks/use-update-user";
import { useActivateUser, useDeactivateUser, useSuspendUser } from "../hooks/use-user-lifecycle";
import { useSendPasswordResetEmail } from "../hooks/use-send-password-reset-email";
import { UserForm } from "../components/UserForm";
import { UserRoleAssignment } from "../components/UserRoleAssignment";
import { getUserManagementErrorMessage } from "../utils/user-management-error-messages";

export function UserDetailScreen() {
  const router = useRouter();
  const params = useParams<{ userUuid: string }>();
  const userUuid = params.userUuid;

  const userQuery = useUser(userUuid);
  const updateUser = useUpdateUser(userUuid);
  const activateUser = useActivateUser(userUuid);
  const suspendUser = useSuspendUser(userUuid);
  const deactivateUser = useDeactivateUser(userUuid);
  const sendPasswordResetEmail = useSendPasswordResetEmail();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSuspendConfirmOpen, setIsSuspendConfirmOpen] = useState(false);
  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState(false);
  const [isResetPasswordConfirmOpen, setIsResetPasswordConfirmOpen] = useState(false);

  const user = userQuery.data;
  const canActivate = user?.status === "INVITED" || user?.status === "SUSPENDED";
  const canSuspend = user?.status === "ACTIVE";
  const canDeactivate = user?.status === "ACTIVE";

  return (
    <div>
      <PageHeader
        title={user ? `${user.firstName} ${user.lastName}` : "User"}
        description="User details, lifecycle, access, and Role assignment."
        actions={
          <LoadingButton variant="ghost" size="sm" isLoading={false} onClick={() => router.push("/users")}>
            Back to Users
          </LoadingButton>
        }
      />

      {userQuery.isLoading && (
        <Card>
          <CardContent className="flex flex-col gap-3 pt-6">
            <Skeleton variant="text" className="w-1/3" />
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="text" className="w-1/4" />
          </CardContent>
        </Card>
      )}

      {userQuery.isError && (
        <Alert variant="error" message={getUserManagementErrorMessage(userQuery.error) ?? "Failed to load User."} />
      )}

      {user && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                  <UserIcon className="h-5 w-5" />
                </span>
                <CardTitle>{user.displayName ?? `${user.firstName} ${user.lastName}`}</CardTitle>
                <StatusBadge status={user.status} />
              </div>
              <LoadingButton
                variant="secondary"
                size="sm"
                isLoading={false}
                leadingIcon={<PencilIcon className="h-4 w-4" />}
                onClick={() => setIsEditOpen(true)}
              >
                Edit
              </LoadingButton>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-4">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Email" value={user.email} />
                <Field label="Mobile Number" value={user.mobileNumber ?? "—"} />
                <Field label="Display Name" value={user.displayName ?? "—"} />
                <Field label="Company" value={user.companyUuid} />
                <Field label="Branch" value={user.branchUuid ?? "—"} />
                <Field label="Department" value={user.departmentUuid ?? "—"} />
              </dl>

              <div className="flex flex-wrap items-center gap-2 border-t border-surface-border light:border-light-surface-border pt-4">
                <LoadingButton
                  variant="secondary"
                  size="sm"
                  isLoading={activateUser.isPending}
                  disabled={!canActivate}
                  onClick={() => activateUser.mutate()}
                >
                  Activate
                </LoadingButton>
                <LoadingButton
                  variant="secondary"
                  size="sm"
                  isLoading={false}
                  disabled={!canSuspend}
                  onClick={() => setIsSuspendConfirmOpen(true)}
                >
                  Suspend
                </LoadingButton>
                <LoadingButton
                  variant="danger"
                  size="sm"
                  isLoading={false}
                  disabled={!canDeactivate}
                  onClick={() => setIsDeactivateConfirmOpen(true)}
                >
                  Deactivate
                </LoadingButton>
                <LoadingButton
                  variant="ghost"
                  size="sm"
                  isLoading={false}
                  leadingIcon={<MailIcon className="h-4 w-4" />}
                  onClick={() => setIsResetPasswordConfirmOpen(true)}
                  className="ml-auto"
                >
                  Send Password Reset Email
                </LoadingButton>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <UserRoleAssignment userUuid={userUuid} />
            </CardContent>
          </Card>
        </div>
      )}

      <Drawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit User"
        description="Update this User's details, and Company/Branch/Department assignment."
      >
        {user && (
          <UserForm
            defaultValues={{
              companyUuid: user.companyUuid,
              branchUuid: user.branchUuid ?? "",
              departmentUuid: user.departmentUuid ?? "",
              firstName: user.firstName,
              middleName: user.middleName ?? "",
              lastName: user.lastName,
              displayName: user.displayName ?? "",
              email: user.email,
              mobileNumber: user.mobileNumber ?? "",
            }}
            isSubmitting={updateUser.isPending}
            serverError={getUserManagementErrorMessage(updateUser.error)}
            fieldErrors={updateUser.error?.details}
            onSubmit={(values) =>
              updateUser.mutate(
                {
                  ...values,
                  branchUuid: values.branchUuid || null,
                  departmentUuid: values.departmentUuid || null,
                  middleName: values.middleName || null,
                  displayName: values.displayName || null,
                  mobileNumber: values.mobileNumber || null,
                },
                { onSuccess: () => setIsEditOpen(false) },
              )
            }
          />
        )}
      </Drawer>

      <ConfirmDialog
        isOpen={isSuspendConfirmOpen}
        onClose={() => setIsSuspendConfirmOpen(false)}
        onConfirm={() => suspendUser.mutate(undefined, { onSuccess: () => setIsSuspendConfirmOpen(false) })}
        title="Suspend this User?"
        description="Suspending prevents this User from signing in until reactivated."
        confirmLabel="Suspend User"
        isDestructive
        isConfirming={suspendUser.isPending}
      />

      <ConfirmDialog
        isOpen={isDeactivateConfirmOpen}
        onClose={() => setIsDeactivateConfirmOpen(false)}
        onConfirm={() => deactivateUser.mutate(undefined, { onSuccess: () => setIsDeactivateConfirmOpen(false) })}
        title="Deactivate this User?"
        description="Deactivation is terminal — this User cannot be reactivated afterward."
        confirmLabel="Deactivate User"
        isDestructive
        isConfirming={deactivateUser.isPending}
      />

      <ConfirmDialog
        isOpen={isResetPasswordConfirmOpen}
        onClose={() => setIsResetPasswordConfirmOpen(false)}
        onConfirm={() =>
          user &&
          sendPasswordResetEmail.mutate(user.email, { onSuccess: () => setIsResetPasswordConfirmOpen(false) })
        }
        title="Send password reset email?"
        description={user ? `A password reset link will be emailed to ${user.email}.` : undefined}
        confirmLabel="Send Email"
        isConfirming={sendPasswordResetEmail.isPending}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted light:text-light-ink-muted">{label}</dt>
      <dd className="mt-1 truncate text-sm text-ink light:text-light-ink">{value}</dd>
    </div>
  );
}
