// Business layer — the named onboarding workflow (00_BUSINESS_RULES.md
// Ch.10.6: "Organization Administrator invites User by email" is the sole
// documented way a User comes into existence; the handbook defines no
// separate "create" concept distinct from invitation). Delegates to
// createUser rather than duplicating its email-uniqueness check
// (Ch.10.8) — this file exists to expose the operation under the
// business-vocabulary name Ch.10 uses throughout (Ch.6.6, Domain Vocabulary
// Consistency), for callers (e.g. the future Presentation layer) that model
// the action as "inviting a User", not "creating a row".
import { createUser, CreateUserInput, CreateUserDeps } from "./create-user.service";
import { User } from "../domain/aggregates/user.aggregate";

export type InviteUserInput = CreateUserInput;
export type InviteUserDeps = CreateUserDeps;

export async function inviteUser(input: InviteUserInput, deps: InviteUserDeps): Promise<User> {
  return createUser(input, deps);
}
