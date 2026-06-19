import { Controller, Get, Param } from "@nestjs/common";
import { ExercisesService } from "./exercises.service";

// Public, unauthenticated read access for the frontend app.
@Controller("exercises")
export class ExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  catalog() {
    return this.exercises.publicCatalog();
  }

  @Get(":slug")
  detail(@Param("slug") slug: string) {
    return this.exercises.publicDetail(slug);
  }
}
