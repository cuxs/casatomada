"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type AttendanceSlice,
  attendanceBreakdown,
  entriesByHour,
  freeAttendanceBreakdown,
  salesOverTime,
} from "@/lib/sales-stats";
import type { Sale } from "@/lib/sales-summary";

const COLOR_ATTENDED = "#2a78d6";
const COLOR_NOT_ATTENDED = "#c3c2b7";
const TEXT_SECONDARY = "#52514e";
const GRIDLINE = "#e1e0d9";
const SURFACE = "#fcfcfb";

function formatARS(value: number) {
  return `$${value.toLocaleString("es-AR")}`;
}

function AttendancePie({
  title,
  data,
}: {
  title: string;
  data: AttendanceSlice[];
}) {
  const attended = data[0]?.value ?? 0;
  const notAttended = data[1]?.value ?? 0;
  const total = attended + notAttended;
  const pct = total > 0 ? Math.round((attended / total) * 100) : 0;

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-semibold text-gray-800 mb-2 text-center">
        {title}
      </h3>
      {total === 0 ? (
        <p className="text-sm text-gray-400 py-8">Sin datos todavía.</p>
      ) : (
        <>
          <div className="relative w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="65%"
                  outerRadius="90%"
                  paddingAngle={2}
                  stroke={SURFACE}
                  strokeWidth={2}
                >
                  <Cell fill={COLOR_ATTENDED} />
                  <Cell fill={COLOR_NOT_ATTENDED} />
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString("es-AR")} entradas`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900">{pct}%</span>
              <span className="text-xs text-gray-500">asistió</span>
            </div>
          </div>
          <ul className="flex gap-4 mt-2 text-sm text-gray-600">
            <li className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLOR_ATTENDED }}
              />
              Asistieron ({attended.toLocaleString("es-AR")})
            </li>
            <li className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLOR_NOT_ATTENDED }}
              />
              No asistieron ({notAttended.toLocaleString("es-AR")})
            </li>
          </ul>
        </>
      )}
    </div>
  );
}

export default function SalesCharts({ sales }: { sales: Sale[] }) {
  const [granularity, setGranularity] = useState<"day" | "week">("day");

  const attendance = useMemo(() => attendanceBreakdown(sales), [sales]);
  const freeAttendance = useMemo(() => freeAttendanceBreakdown(sales), [sales]);
  const timeSeries = useMemo(
    () => salesOverTime(sales, granularity),
    [sales, granularity],
  );
  const hourly = useMemo(() => entriesByHour(sales), [sales]);

  if (sales.length === 0) return null;

  return (
    <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 lg:px-4 lg:py-2.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">
          Estadísticas
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 px-6 py-6 lg:px-4">
        <AttendancePie title="Asistencia" data={attendance} />
        <AttendancePie title="Entradas gratuitas" data={freeAttendance} />
      </div>

      <div className="px-6 py-6 lg:px-4 border-t border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-800">
            Ventas en el tiempo
          </h3>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setGranularity("day")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                granularity === "day"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Día
            </button>
            <button
              type="button"
              onClick={() => setGranularity("week")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                granularity === "week"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Semana
            </button>
          </div>
        </div>

        {timeSeries.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            Sin datos todavía.
          </p>
        ) : (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={timeSeries}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke={GRIDLINE} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: TEXT_SECONDARY }}
                  axisLine={{ stroke: GRIDLINE }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: TEXT_SECONDARY }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tickFormatter={(value: number) =>
                    `$${(value / 1000).toLocaleString("es-AR")}k`
                  }
                />
                <Tooltip
                  formatter={(value) => [formatARS(Number(value)), "Recaudado"]}
                  labelStyle={{ color: "#0b0b0b" }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke={COLOR_ATTENDED}
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    fill: COLOR_ATTENDED,
                    strokeWidth: 2,
                    stroke: SURFACE,
                  }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="px-6 py-6 lg:px-4 border-t border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">
          Horario de ingreso
        </h3>

        {hourly.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">
            Sin datos todavía.
          </p>
        ) : (
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hourly}
                barCategoryGap={4}
                margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke={GRIDLINE} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: TEXT_SECONDARY }}
                  axisLine={{ stroke: GRIDLINE }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: TEXT_SECONDARY }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toLocaleString("es-AR")} entradas`,
                    "Ingresos",
                  ]}
                />
                <Bar
                  dataKey="count"
                  fill={COLOR_ATTENDED}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </section>
  );
}
