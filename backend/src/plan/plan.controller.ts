import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Put,
  UseGuards,
} from "@nestjs/common";
import { PlanService } from "./plan.service";
import { PlanPayloadDto } from "./dto/plan.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { AuthedUser } from "../auth/jwt.strategy";

@UseGuards(JwtAuthGuard)
@Controller("plan")
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  async getPlan(@CurrentUser() user: AuthedUser) {
    const plan = await this.planService.getPlan(user.id);
    return { plan };
  }

  @Put()
  @HttpCode(204)
  async savePlan(
    @CurrentUser() user: AuthedUser,
    @Body() payload: PlanPayloadDto,
  ): Promise<void> {
    await this.planService.savePlan(user.id, payload);
  }

  @Delete()
  @HttpCode(204)
  async deletePlan(@CurrentUser() user: AuthedUser): Promise<void> {
    await this.planService.deletePlan(user.id);
  }
}
