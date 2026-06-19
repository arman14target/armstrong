import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ExercisesService } from "./exercises.service";
import { ListExercisesQueryDto } from "./dto/exercises.dto";
import { AdminJwtGuard } from "../admin/auth/admin-jwt.guard";
import { RolesGuard } from "../admin/auth/roles.guard";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MulterFile = any;

@UseGuards(AdminJwtGuard, RolesGuard)
@Controller("admin/exercises")
export class AdminExercisesController {
  constructor(private readonly exercises: ExercisesService) {}

  @Get()
  list(@Query() query: ListExercisesQueryDto) {
    return this.exercises.list(query);
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.exercises.detail(id);
  }

  @Post(":id/media")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  addMedia(@Param("id") id: string, @UploadedFile() file: MulterFile) {
    if (!file) {
      throw new BadRequestException("No file uploaded (field name: file).");
    }
    return this.exercises.addMedia(id, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      size: file.size,
    });
  }

  @Delete(":id/media/:mediaId")
  @HttpCode(204)
  async deleteMedia(
    @Param("id") id: string,
    @Param("mediaId") mediaId: string,
  ): Promise<void> {
    await this.exercises.deleteMedia(id, mediaId);
  }
}
