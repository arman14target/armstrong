import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AdminRole } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

// Distinct from the app-user "jwt" strategy: own name, own secret, own table.
// An admin token can never authenticate against user routes and vice-versa.
export const ADMIN_JWT_STRATEGY = "admin-jwt";

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: AdminRole;
}

export interface AuthedAdmin {
  id: string;
  email: string;
  role: AdminRole;
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(
  Strategy,
  ADMIN_JWT_STRATEGY,
) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.ADMIN_JWT_SECRET ?? "change-me-admin-secret",
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AuthedAdmin> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, disabled: true },
    });

    if (!admin || admin.disabled) {
      throw new UnauthorizedException();
    }

    return { id: admin.id, email: admin.email, role: admin.role };
  }
}
