export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export interface CalendarCell {
  day: number | null;
  dateKey: string | null;
}

export function buildMonthCalendar(
  year: number,
  month: number,
): CalendarCell[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const cells: CalendarCell[] = [];

  for (let index = 0; index < startWeekday; index += 1) {
    cells.push({ day: null, dateKey: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      dateKey: toLocalDateKey(new Date(year, month, day)),
    });
  }

  return cells;
}

export const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

export function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function getMonthPrefix(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
