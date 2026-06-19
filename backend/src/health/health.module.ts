import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";

// PrismaService is provided globally (PrismaModule is @Global).
@Module({ controllers: [HealthController] })
export class HealthModule {}
