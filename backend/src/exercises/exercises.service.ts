import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { MediaType, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CloudinaryService } from "./cloudinary.service";

export interface UploadFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class ExercisesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async list(params: {
    page: number;
    pageSize: number;
    search?: string;
    muscle?: string;
  }) {
    const { page, pageSize, search, muscle } = params;
    const where: Prisma.ExerciseWhereInput = {
      ...(search
        ? { name: { contains: search, mode: "insensitive" } }
        : {}),
      ...(muscle ? { primaryMuscles: { has: muscle } } : {}),
    };

    const [total, exercises] = await Promise.all([
      this.prisma.exercise.count({ where }),
      this.prisma.exercise.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          name: true,
          category: true,
          equipment: true,
          level: true,
          primaryMuscles: true,
          media: {
            orderBy: { position: "asc" },
            take: 1,
            select: { url: true, type: true },
          },
          _count: { select: { media: true } },
        },
      }),
    ]);

    return { total, page, pageSize, exercises };
  }

  /** Public catalog for the frontend — lightweight, with a thumbnail. */
  async publicCatalog() {
    const rows = await this.prisma.exercise.findMany({
      orderBy: { name: "asc" },
      select: {
        slug: true,
        name: true,
        category: true,
        equipment: true,
        level: true,
        primaryMuscles: true,
        media: {
          orderBy: { position: "asc" },
          take: 1,
          select: { url: true, type: true },
        },
      },
    });
    return rows.map((r) => ({
      id: r.slug,
      name: r.name,
      category: r.category,
      equipment: r.equipment,
      level: r.level,
      primaryMuscles: r.primaryMuscles,
      image: r.media[0]?.type === "IMAGE" ? r.media[0].url : null,
    }));
  }

  /** Public detail by slug (frontend uses the dataset slug as the id). */
  async publicDetail(slug: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { slug },
      include: { media: { orderBy: { position: "asc" } } },
    });
    if (!exercise) {
      throw new NotFoundException("Exercise not found");
    }
    return exercise;
  }

  async detail(id: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
      include: { media: { orderBy: { position: "asc" } } },
    });
    if (!exercise) {
      throw new NotFoundException("Exercise not found");
    }
    return exercise;
  }

  async addMedia(exerciseId: string, file: UploadFile) {
    if (!this.cloudinary.isConfigured()) {
      throw new BadRequestException(
        "Media uploads are not configured (missing Cloudinary credentials).",
      );
    }
    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");
    if (!isImage && !isVideo) {
      throw new BadRequestException("Only image or video files are allowed.");
    }

    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      select: { id: true, slug: true },
    });
    if (!exercise) {
      throw new NotFoundException("Exercise not found");
    }

    const uploaded = await this.cloudinary.upload(
      file.buffer,
      file.mimetype,
      `armstrong/exercises/${exercise.slug}`,
    );

    const max = await this.prisma.exerciseMedia.aggregate({
      where: { exerciseId },
      _max: { position: true },
    });

    return this.prisma.exerciseMedia.create({
      data: {
        exerciseId,
        type: uploaded.resourceType === "video" ? MediaType.VIDEO : MediaType.IMAGE,
        url: uploaded.url,
        cloudinaryId: uploaded.publicId,
        position: (max._max.position ?? -1) + 1,
        source: "upload",
      },
    });
  }

  async deleteMedia(exerciseId: string, mediaId: string): Promise<void> {
    const media = await this.prisma.exerciseMedia.findFirst({
      where: { id: mediaId, exerciseId },
    });
    if (!media) {
      throw new NotFoundException("Media not found");
    }
    if (media.cloudinaryId) {
      await this.cloudinary.destroy(
        media.cloudinaryId,
        media.type === MediaType.VIDEO,
      );
    }
    await this.prisma.exerciseMedia.delete({ where: { id: media.id } });
  }
}
