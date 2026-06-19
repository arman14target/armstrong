import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AdminAuthService } from "./admin-auth.service";
import { AdminSignInDto } from "./dto/admin-auth.dto";
import { AdminJwtGuard } from "./admin-jwt.guard";
import { CurrentAdmin } from "./current-admin.decorator";
import type { AuthedAdmin } from "./admin-jwt.strategy";

// /api/admin/auth/* — separate from the app-user auth at /api/auth/*.
@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  @Post("signin")
  signIn(@Body() dto: AdminSignInDto) {
    return this.adminAuth.signIn(dto.email, dto.password);
  }

  @UseGuards(AdminJwtGuard)
  @Get("me")
  me(@CurrentAdmin() admin: AuthedAdmin) {
    return { admin };
  }
}
