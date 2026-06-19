"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Panel } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { SignupChart } from "@/components/SignupChart";
import { fetchStats, type DashboardStats } from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((e) => setError(e.message ?? "Failed to load stats"));
  }, []);

  return (
    <AdminShell>
      <h1 className="mb-6 font-heading text-2xl tracking-wider text-heading">
        Dashboard
      </h1>

      {error && <p className="mb-4 text-sm text-error">{error}</p>}

      {!stats ? (
        <p className="text-sm text-dim">Loading stats…</p>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Total users" value={stats.totalUsers} accent />
            <StatCard label="New today" value={stats.newUsersToday} />
            <StatCard label="New · 7 days" value={stats.newUsers7d} />
            <StatCard label="New · 30 days" value={stats.newUsers30d} />
            <StatCard
              label="On a coach plan"
              value={stats.coachPlanUsers}
              sub={`${pct(stats.coachPlanUsers, stats.totalUsers)} of users`}
            />
            <StatCard
              label="Nutrition set up"
              value={stats.nutritionUsers}
              sub={`${pct(stats.nutritionUsers, stats.totalUsers)} of users`}
            />
            <StatCard
              label="Logged a workout"
              value={stats.usersWhoLoggedWorkout}
            />
            <StatCard
              label="Training now"
              value={stats.activeSessionsNow}
              sub="active sessions"
            />
            <StatCard
              label="Workouts logged"
              value={stats.totalWorkoutsLogged}
            />
            <StatCard label="Food entries" value={stats.totalFoodEntries} />
            <StatCard label="Disabled users" value={stats.disabledUsers} />
          </div>

          <Panel title="Signups · last 14 days">
            <SignupChart data={stats.signupsByDay} />
          </Panel>
        </div>
      )}
    </AdminShell>
  );
}

function pct(n: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((n / total) * 100)}%`;
}
