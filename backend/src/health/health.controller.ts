import {
  Controller,
  Get,
  ServiceUnavailableException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // GET /api/health — liveness + DB connectivity. For uptime monitors.
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", db: "up", uptime: process.uptime() };
    } catch {
      throw new ServiceUnavailableException({ status: "degraded", db: "down" });
    }
  }
}
