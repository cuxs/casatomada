import type { Sale } from "./sales-summary";

export interface AttendanceSlice {
  name: string;
  value: number;
}

export function attendanceBreakdown(sales: Sale[]): AttendanceSlice[] {
  let attended = 0;
  let notAttended = 0;

  for (const sale of sales) {
    if (sale.used) attended += sale.ticketCount;
    else notAttended += sale.ticketCount;
  }

  return [
    { name: "Asistieron", value: attended },
    { name: "No asistieron", value: notAttended },
  ];
}

export function freeAttendanceBreakdown(sales: Sale[]): AttendanceSlice[] {
  return attendanceBreakdown(sales.filter((sale) => (sale.price ?? 0) === 0));
}

export interface SalesTimePoint {
  key: string;
  label: string;
  total: number;
}

function startOfWeek(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);
  return monday;
}

const BUCKET_LABEL = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
});

export function salesOverTime(
  sales: Sale[],
  granularity: "day" | "week",
): SalesTimePoint[] {
  const buckets = new Map<string, { date: Date; total: number }>();

  for (const sale of sales) {
    const createdAt = new Date(sale.createdAt);
    const bucketDate =
      granularity === "week"
        ? startOfWeek(createdAt)
        : new Date(
            createdAt.getFullYear(),
            createdAt.getMonth(),
            createdAt.getDate(),
          );
    const key = bucketDate.toISOString();
    const entry = buckets.get(key) ?? { date: bucketDate, total: 0 };
    entry.total += sale.price ?? 0;
    buckets.set(key, entry);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { date, total }]) => ({
      key,
      label: BUCKET_LABEL.format(date),
      total,
    }));
}

export interface HourlyEntry {
  hour: number;
  label: string;
  count: number;
}

// Entradas por hora suelen arrancar de noche y seguir de madrugada, así que
// se ordenan tratando las primeras horas del día (0-11) como continuación de
// la noche anterior en vez de ordenarlas primero por hora del reloj.
function nightOrderedHour(hour: number): number {
  return hour < 12 ? hour + 24 : hour;
}

export function entriesByHour(sales: Sale[]): HourlyEntry[] {
  const counts = new Map<number, number>();

  for (const sale of sales) {
    if (!sale.used || !sale.usedAt) continue;
    const hour = new Date(sale.usedAt).getHours();
    counts.set(hour, (counts.get(hour) ?? 0) + sale.ticketCount);
  }

  return Array.from(counts.entries())
    .sort(([a], [b]) => nightOrderedHour(a) - nightOrderedHour(b))
    .map(([hour, count]) => ({
      hour,
      label: `${hour.toString().padStart(2, "0")}:00`,
      count,
    }));
}
