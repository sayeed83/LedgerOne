// Re-exports Domain-owned enums through the Business layer's public
// surface, same seam as authorization-errors.ts. 04_FOLDER_STRUCTURE.md
// §19.3 / 05_CODING_STANDARDS.md Ch.9.3: `presentation/` may import
// `business/` only, never `domain/` directly — a Presentation-layer Zod
// schema that needs to validate against these enums' exact values (e.g.
// `z.nativeEnum(...)`) imports them from here.
export { RoleStatus } from "../domain/enums/role-status.enum";
export { PermissionAction } from "../domain/enums/permission-action.enum";
