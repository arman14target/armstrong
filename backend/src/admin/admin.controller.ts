import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminRole } from "@prisma/client";
import { AdminService } from "./admin.service";
import {
  CreateAdminDto,
  ListUsersQueryDto,
  SetDisabledDto,
} from "./dto/admin.dto";
import { AdminJwtGuard } from "./auth/admin-jwt.guard";
import { RolesGuard } from "./auth/roles.guard";
import { Roles } from "./auth/roles.decorator";
import { CurrentAdmin } from "./auth/current-admin.decorator";
import type { AuthedAdmin } from "./auth/admin-jwt.strategy";

// Every route requires a valid admin token; some require SUPERADMIN.
@UseGuards(AdminJwtGuard, RolesGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("stats")
  stats() {
    return this.adminService.getStats();
  }

  @Get("users")
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Patch("users/:id/disabled")
  setUserDisabled(@Param("id") id: string, @Body() dto: SetDisabledDto) {
    return this.adminService.setUserDisabled(id, dto.disabled);
  }

  @Roles(AdminRole.SUPERADMIN)
  @Delete("users/:id")
  @HttpCode(204)
  async deleteUser(@Param("id") id: string): Promise<void> {
    await this.adminService.deleteUser(id);
  }

  // --- Admin account management: SUPERADMIN only ---

  @Roles(AdminRole.SUPERADMIN)
  @Get("admins")
  listAdmins() {
    return this.adminService.listAdmins();
  }

  @Roles(AdminRole.SUPERADMIN)
  @Post("admins")
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto.email, dto.password, dto.role);
  }

  @Roles(AdminRole.SUPERADMIN)
  @Patch("admins/:id/disabled")
  setAdminDisabled(
    @Param("id") id: string,
    @Body() dto: SetDisabledDto,
    @CurrentAdmin() admin: AuthedAdmin,
  ) {
    return this.adminService.setAdminDisabled(id, dto.disabled, admin.id);
  }
}
