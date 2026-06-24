import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { GymsController } from "./gyms.controller";
import { GymsService } from "./gyms.service";
import { GymEnrichmentService } from "./gym-enrichment.service";
import { AdminGymsController } from "./admin-gyms.controller";
import { AdminGymsService } from "./admin-gyms.service";

@Module({
  // AdminModule provides the admin-jwt strategy used by the route guards.
  imports: [AdminModule],
  controllers: [GymsController, AdminGymsController],
  providers: [GymsService, GymEnrichmentService, AdminGymsService],
})
export class GymsModule {}
