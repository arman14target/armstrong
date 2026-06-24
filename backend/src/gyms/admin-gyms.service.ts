import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export interface ListGymsParams {
  page: number;
  pageSize: number;
  search?: string;
}

@Injectable()
export class AdminGymsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: ListGymsParams) {
    const { page, pageSize, search } = params;
    const where: Prisma.GymWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [total, gyms] = await Promise.all([
      this.prisma.gym.count({ where }),
      this.prisma.gym.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { pricePlans: true, amenities: true } },
        },
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      gyms: gyms.map((g) => ({
        id: g.id,
        fsqPlaceId: g.fsqPlaceId,
        name: g.name,
        address: g.address,
        country: g.country,
        website: g.website,
        rating: g.rating,
        quietTimes: g.quietTimes,
        pricePlanCount: g._count.pricePlans,
        amenityCount: g._count.amenities,
        lastEnrichedAt: g.lastEnrichedAt?.toISOString() ?? null,
      })),
    };
  }

  async detail(id: string) {
    const gym = await this.prisma.gym.findUnique({
      where: { id },
      include: {
        pricePlans: { orderBy: { createdAt: "asc" } },
        amenities: { orderBy: { name: "asc" } },
      },
    });
    if (!gym) {
      throw new NotFoundException("Gym not found");
    }
    return gym;
  }

  async update(
    id: string,
    data: { name?: string; website?: string | null; quietTimes?: string | null },
  ) {
    await this.ensureExists(id);
    return this.prisma.gym.update({ where: { id }, data });
  }

  async addPricePlan(
    id: string,
    data: { name: string; priceText: string; period?: string | null },
  ) {
    await this.ensureExists(id);
    return this.prisma.gymPricePlan.create({
      data: {
        gymId: id,
        name: data.name,
        priceText: data.priceText,
        period: data.period ?? null,
        source: "admin",
      },
    });
  }

  async updatePricePlan(
    planId: string,
    data: { name?: string; priceText?: string; period?: string | null },
  ) {
    await this.ensurePlan(planId);
    return this.prisma.gymPricePlan.update({
      where: { id: planId },
      // Edits become admin-owned so a re-crawl won't overwrite them.
      data: { ...data, source: "admin" },
    });
  }

  async deletePricePlan(planId: string) {
    await this.ensurePlan(planId);
    await this.prisma.gymPricePlan.delete({ where: { id: planId } });
  }

  async addAmenity(id: string, name: string) {
    await this.ensureExists(id);
    // Unique on (gymId, name) — upsert avoids a duplicate-key error.
    return this.prisma.gymAmenity.upsert({
      where: { gymId_name: { gymId: id, name } },
      create: { gymId: id, name, source: "admin" },
      update: { source: "admin" },
    });
  }

  async deleteAmenity(amenityId: string) {
    const amenity = await this.prisma.gymAmenity.findUnique({
      where: { id: amenityId },
    });
    if (!amenity) {
      throw new NotFoundException("Amenity not found");
    }
    await this.prisma.gymAmenity.delete({ where: { id: amenityId } });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.gym.delete({ where: { id } });
  }

  private async ensureExists(id: string) {
    const gym = await this.prisma.gym.findUnique({ where: { id } });
    if (!gym) {
      throw new NotFoundException("Gym not found");
    }
  }

  private async ensurePlan(planId: string) {
    const plan = await this.prisma.gymPricePlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException("Price plan not found");
    }
  }
}
