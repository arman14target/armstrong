import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PLAN_USER_INCLUDE, toPayload, writePayload } from "./plan.mapper";
import type { UserPlanPayload } from "./plan.types";

@Injectable()
export class PlanService {
  constructor(private readonly prisma: PrismaService) {}

  /** Returns the user's plan, or null if they have never synced. */
  async getPlan(userId: string): Promise<UserPlanPayload | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: PLAN_USER_INCLUDE,
    });

    if (!user) {
      return null;
    }

    // A brand-new account has no plan rows yet — signal "no remote plan" so the
    // client pushes its local state (matches the old Supabase maybeSingle()).
    const hasPlan =
      user.meta != null ||
      user.builtinWorkouts.length > 0 ||
      user.customWorkouts.length > 0;

    return hasPlan ? toPayload(user) : null;
  }

  async savePlan(
    userId: string,
    payload: UserPlanPayload,
  ): Promise<void> {
    await this.prisma.$transaction((tx) =>
      writePayload(tx, userId, payload),
    );
  }

  async deletePlan(userId: string): Promise<void> {
    // All plan tables cascade on user delete; here we clear them but keep the
    // account, mirroring the old per-row delete of user_plans.
    await this.prisma.$transaction([
      this.prisma.planMeta.deleteMany({ where: { userId } }),
      this.prisma.builtinWorkout.deleteMany({ where: { userId } }),
      this.prisma.customWorkout.deleteMany({ where: { userId } }),
      this.prisma.activeSession.deleteMany({ where: { userId } }),
      this.prisma.completionDate.deleteMany({ where: { userId } }),
      this.prisma.workoutDayEntry.deleteMany({ where: { userId } }),
      this.prisma.foodEntry.deleteMany({ where: { userId } }),
      this.prisma.chatMessage.deleteMany({ where: { userId } }),
    ]);
  }
}
