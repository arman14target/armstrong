import { Module } from "@nestjs/common";
import { ExercisesService } from "./exercises.service";
import { CloudinaryService } from "./cloudinary.service";
import { AdminExercisesController } from "./admin-exercises.controller";
import { ExercisesController } from "./exercises.controller";
import { AdminModule } from "../admin/admin.module";

@Module({
  // AdminModule provides the admin-jwt strategy used by the route guards.
  imports: [AdminModule],
  controllers: [ExercisesController, AdminExercisesController],
  providers: [ExercisesService, CloudinaryService],
})
export class ExercisesModule {}
