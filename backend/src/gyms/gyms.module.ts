import { Module } from "@nestjs/common";
import { GymsController } from "./gyms.controller";
import { GymsService } from "./gyms.service";
import { GymEnrichmentService } from "./gym-enrichment.service";

@Module({
  controllers: [GymsController],
  providers: [GymsService, GymEnrichmentService],
})
export class GymsModule {}
