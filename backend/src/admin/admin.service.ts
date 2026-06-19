import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AdminRole, Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";

export interface DashboardStats {
  totalUsers: number;
  disabledUsers: number;
  newUsersToday: number;
  newUsers7d: number;
  newUsers30d: number;
  coachPlanUsers: number;
  nutritionUsers: number;
  usersWhoLoggedWorkout: number;
  activeSessionsNow: number;
  totalWorkoutsLogged: number;
  totalFoodEntries: number;
  signupsByDay: { day: string; count: number }[];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<DashboardStats> {
    const [
      totalUsers,
      disabledUsers,
      newUsersToday,
      newUsers7d,
      newUsers30d,
      coachPlanUsers,
      nutritionUsers,
      activeSessionsNow,
      totalWorkoutsLogged,
      totalFoodEntries,
      workoutUserGroups,
      signupRows,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { disabled: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: daysAgo(0) } } }),
      this.prisma.user.count({ where: { createdAt: { gte: daysAgo(7) } } }),
      this.prisma.user.count({ where: { createdAt: { gte: daysAgo(30) } } }),
      this.prisma.planMeta.count({ where: { coachPlanActive: true } }),
      this.prisma.planMeta.count({
        where: { nutritionProfile: { not: Prisma.JsonNull } },
      }),
      this.prisma.activeSession.count(),
      this.prisma.workoutDayEntry.count(),
      this.prisma.foodEntry.count(),
      this.prisma.workoutDayEntry.groupBy({ by: ["userId"] }),
      this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT date_trunc('day', created_at)::date AS day, count(*)::int AS count
        FROM users
        WHERE created_at >= ${daysAgo(13)}
        GROUP BY day
        ORDER BY day ASC
      `,
    ]);

    return {
      totalUsers,
      disabledUsers,
      newUsersToday,
      newUsers7d,
      newUsers30d,
      coachPlanUsers,
      nutritionUsers,
      usersWhoLoggedWorkout: workoutUserGroups.length,
      activeSessionsNow,
      totalWorkoutsLogged,
      totalFoodEntries,
      signupsByDay: fillSignupDays(signupRows),
    };
  }

  async listUsers(params: {
    page: number;
    pageSize: number;
    search?: string;
  }) {
    const { page, pageSize, search } = params;
    const where: Prisma.UserWhereInput = search
      ? { email: { contains: search, mode: "insensitive" } }
      : {};

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          disabled: true,
          createdAt: true,
          _count: {
            select: { dayEntries: true, foodEntries: true, customWorkouts: true },
          },
        },
      }),
    ]);

    return { total, page, pageSize, users };
  }

  async setUserDisabled(id: string, disabled: boolean) {
    await this.ensureUser(id);
    return this.prisma.user.update({
      where: { id },
      data: { disabled },
      select: { id: true, email: true, disabled: true },
    });
  }

  async deleteUser(id: string): Promise<void> {
    await this.ensureUser(id);
    await this.prisma.user.delete({ where: { id } });
  }

  // --- Admin account management (SUPERADMIN only via controller guards) ---

  listAdmins() {
    return this.prisma.admin.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        role: true,
        disabled: true,
        createdAt: true,
      },
    });
  }

  async createAdmin(email: string, password: string, role: AdminRole) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.prisma.admin.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new ConflictException("An admin with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.admin.create({
      data: { email: normalizedEmail, passwordHash, role },
      select: { id: true, email: true, role: true, disabled: true },
    });
  }

  async setAdminDisabled(
    targetId: string,
    disabled: boolean,
    actingAdminId: string,
  ) {
    if (targetId === actingAdminId) {
      throw new BadRequestException("You cannot disable your own account");
    }
    const admin = await this.prisma.admin.findUnique({
      where: { id: targetId },
    });
    if (!admin) {
      throw new NotFoundException("Admin not found");
    }
    return this.prisma.admin.update({
      where: { id: targetId },
      data: { disabled },
      select: { id: true, email: true, role: true, disabled: true },
    });
  }

  private async ensureUser(id: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
  }
}

/** Pad the 14-day window so every day has a point (charts look right). */
function fillSignupDays(
  rows: { day: Date; count: bigint | number }[],
): { day: string; count: number }[] {
  const byDay = new Map<string, number>();
  for (const row of rows) {
    const key = new Date(row.day).toISOString().slice(0, 10);
    byDay.set(key, Number(row.count));
  }

  const out: { day: string; count: number }[] = [];
  for (let i = 13; i >= 0; i -= 1) {
    const key = daysAgo(i).toISOString().slice(0, 10);
    out.push({ day: key, count: byDay.get(key) ?? 0 });
  }
  return out;
}
