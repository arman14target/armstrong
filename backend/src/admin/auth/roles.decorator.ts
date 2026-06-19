import { SetMetadata } from "@nestjs/common";
import { AdminRole } from "@prisma/client";

export const ROLES_KEY = "admin_roles";

/** Restrict a route to the given admin roles. SUPERADMIN always passes. */
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
