import { t } from "@/lib/i18n/t";

export function formatTimeAgo(iso?: string, now = Date.now()): string {
  if (!iso) {
    return t("time.never");
  }

  const seconds = Math.max(
    0,
    Math.floor((now - new Date(iso).getTime()) / 1000),
  );

  if (seconds < 60) {
    return t("time.secAgo", { count: seconds });
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return t("time.minAgo", { count: minutes });
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return t("time.hourAgo", { count: hours });
  }

  const days = Math.floor(hours / 24);
  return t("time.dayAgo", { count: days });
}

export function formatDuration(totalSeconds?: number): string {
  if (totalSeconds === undefined) {
    return "—";
  }

  if (totalSeconds < 60) {
    return t("time.sec", { count: totalSeconds });
  }

  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) {
    return t("time.min", { count: minutes });
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return t("time.hour", { count: hours });
  }

  return t("time.durationHoursMinutes", {
    hours,
    minutes: remainingMinutes,
  });
}
