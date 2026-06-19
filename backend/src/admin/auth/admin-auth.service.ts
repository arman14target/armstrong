import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import type { AdminJwtPayload, AuthedAdmin } from "./admin-jwt.strategy";

export interface AdminAuthResult {
  token: string;
  admin: AuthedAdmin;
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signIn(email: string, password: string): Promise<AdminAuthResult> {
    const admin = await this.prisma.admin.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (
      !admin ||
      admin.disabled ||
      !(await bcrypt.compare(password, admin.passwordHash))
    ) {
      throw new UnauthorizedException("Invalid login credentials");
    }

    const safe: AuthedAdmin = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
    };
    const payload: AdminJwtPayload = {
      sub: safe.id,
      email: safe.email,
      role: safe.role,
    };
    return { token: this.jwt.sign(payload), admin: safe };
  }
}
