import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthedAdmin } from "./admin-jwt.strategy";

export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthedAdmin => {
    return ctx.switchToHttp().getRequest().user as AuthedAdmin;
  },
);
