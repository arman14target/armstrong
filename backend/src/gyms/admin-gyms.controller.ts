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
import { AdminJwtGuard } from "../admin/auth/admin-jwt.guard";
import { RolesGuard } from "../admin/auth/roles.guard";
import { AdminGymsService } from "./admin-gyms.service";
import {
  CreateAmenityDto,
  CreatePricePlanDto,
  ListAdminGymsQueryDto,
  UpdateGymDto,
  UpdatePricePlanDto,
} from "./dto/admin-gyms.dto";

// Staff-only curation of the cached gym catalog (built from user comparisons).
@UseGuards(AdminJwtGuard, RolesGuard)
@Controller("admin/gyms")
export class AdminGymsController {
  constructor(private readonly gyms: AdminGymsService) {}

  @Get()
  list(@Query() query: ListAdminGymsQueryDto) {
    return this.gyms.list(query);
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.gyms.detail(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateGymDto) {
    return this.gyms.update(id, body);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id") id: string) {
    await this.gyms.remove(id);
  }

  @Post(":id/price-plans")
  addPricePlan(@Param("id") id: string, @Body() body: CreatePricePlanDto) {
    return this.gyms.addPricePlan(id, body);
  }

  @Patch("price-plans/:planId")
  updatePricePlan(
    @Param("planId") planId: string,
    @Body() body: UpdatePricePlanDto,
  ) {
    return this.gyms.updatePricePlan(planId, body);
  }

  @Delete("price-plans/:planId")
  @HttpCode(204)
  async deletePricePlan(@Param("planId") planId: string) {
    await this.gyms.deletePricePlan(planId);
  }

  @Post(":id/amenities")
  addAmenity(@Param("id") id: string, @Body() body: CreateAmenityDto) {
    return this.gyms.addAmenity(id, body.name);
  }

  @Delete("amenities/:amenityId")
  @HttpCode(204)
  async deleteAmenity(@Param("amenityId") amenityId: string) {
    await this.gyms.deleteAmenity(amenityId);
  }
}
