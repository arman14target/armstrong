import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AdminRole } from "@prisma/client";
import { ROLES_KEY } from "./roles.decorator";
import type { AuthedAdmin } from "./admin-jwt.strategy";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles → any authenticated admin may access.
    if (!required || required.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: AuthedAdmin }>();

    // SUPERADMIN is a superset of every lower tier.
    if (user?.role === AdminRole.SUPERADMIN || (user && required.includes(user.role))) {
      return true;
    }

    throw new ForbiddenException("Insufficient admin privileges");
  }
}
