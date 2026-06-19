import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { PlanModule } from "./plan/plan.module";
import { HealthModule } from "./health/health.module";
import { AdminModule } from "./admin/admin.module";
import { ExercisesModule } from "./exercises/exercises.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PlanModule,
    HealthModule,
    AdminModule,
    ExercisesModule,
  ],
})
export class AppModule {}
