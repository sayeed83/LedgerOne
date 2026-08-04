// Same wire shape as create-user.dto.ts — the Business layer's `inviteUser`
// delegates to `createUser` under Ch.10.6's business-vocabulary name (see
// business/invite-user.service.ts), so this endpoint's request body has no
// independent shape to define.
export { createUserRequestSchema as inviteUserRequestSchema } from "./create-user.dto";
export type { CreateUserRequest as InviteUserRequest } from "./create-user.dto";
