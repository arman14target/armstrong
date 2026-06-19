import { Module } from "@nestjs/common";
import { PlanService } from "./plan.service";
import { PlanController } from "./plan.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [PlanController],
  providers: [PlanService],
})
export class PlanModule {}
