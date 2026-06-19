import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { AdminAuthService } from "./auth/admin-auth.service";
import { AdminAuthController } from "./auth/admin-auth.controller";
import { AdminJwtStrategy } from "./auth/admin-jwt.strategy";

@Module({
  imports: [
    PassportModule,
    // Admin tokens are signed with a SEPARATE secret from app-user tokens.
    JwtModule.register({
      secret: process.env.ADMIN_JWT_SECRET ?? "change-me-admin-secret",
      signOptions: {
        expiresIn: (process.env.ADMIN_JWT_EXPIRES_IN ??
          "12h") as unknown as number,
      },
    }),
  ],
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService, AdminAuthService, AdminJwtStrategy],
})
export class AdminModule {}
