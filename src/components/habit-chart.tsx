"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FieldDefinition } from "@/lib/types";

interface HabitChartProps {
  data: Array<Record<string, number | string>>;
  fieldDefinitions: FieldDefinition[];
}

const NUMBER_COLORS = ["#4f46e5", "#ec4899", "#f59e0b"];
const RATING_COLORS = ["#10b981", "#06b6d4", "#8b5cf6"];

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-1 font-semibold">Day {String(label)}</p>
      <div className="space-y-1">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-zinc-500 dark:text-zinc-400">
              {item.name}:
            </span>
            <span className="font-medium tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HabitChart({ data, fieldDefinitions }: HabitChartProps) {
  const lineFields = fieldDefinitions.filter((f) => f.type === "number");
  const barFields = fieldDefinitions.filter((f) => f.type === "rating");

  return (
    <div className="h-80 w-full text-zinc-500 dark:text-zinc-400">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 16, right: 12, left: 0, bottom: 0 }}
        >
          <defs>
            {lineFields.map((f, i) => (
              <linearGradient
                key={f.key}
                id={`area-grad-${f.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={NUMBER_COLORS[i % NUMBER_COLORS.length]}
                  stopOpacity={0.18}
                />
                <stop
                  offset="100%"
                  stopColor={NUMBER_COLORS[i % NUMBER_COLORS.length]}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
            {barFields.map((f, i) => (
              <linearGradient
                key={f.key}
                id={`bar-grad-${f.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={RATING_COLORS[i % RATING_COLORS.length]}
                  stopOpacity={1}
                />
                <stop
                  offset="100%"
                  stopColor={RATING_COLORS[i % RATING_COLORS.length]}
                  stopOpacity={0.55}
                />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => String(Number(d.slice(-2)))}
            tick={{ fontSize: 12 }}
            stroke="currentColor"
            tickLine={false}
            axisLine={false}
            minTickGap={28}
            dy={6}
          />
          <YAxis
            yAxisId="number"
            width={42}
            tick={{ fontSize: 12 }}
            stroke="currentColor"
            tickLine={false}
            axisLine={false}
          />
          {barFields.length > 0 && (
            <YAxis
              yAxisId="rating"
              orientation="right"
              width={34}
              domain={[0, (dataMax: number) => Math.max(10, Math.ceil(dataMax) + 1)]}
              tick={{ fontSize: 12 }}
              stroke="currentColor"
              tickLine={false}
              axisLine={false}
            />
          )}

          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "rgba(99, 102, 241, 0.06)" }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />

          {lineFields.map((f) => (
            <Area
              key={f.key}
              yAxisId="number"
              dataKey={f.key}
              stroke="none"
              fill={`url(#area-grad-${f.key})`}
              activeDot={false}
              legendType="none"
            />
          ))}

          {barFields.map((f) => (
            <Bar
              key={f.key}
              yAxisId="rating"
              dataKey={f.key}
              name={f.label}
              fill={`url(#bar-grad-${f.key})`}
              radius={[4, 4, 0, 0]}
              maxBarSize={22}
            />
          ))}

          {lineFields.map((f, i) => (
            <Line
              key={f.key}
              yAxisId="number"
              dataKey={f.key}
              name={f.label}
              stroke={NUMBER_COLORS[i % NUMBER_COLORS.length]}
              strokeWidth={2.5}
              dot={{
                r: 3,
                strokeWidth: 0,
                fill: NUMBER_COLORS[i % NUMBER_COLORS.length],
              }}
              activeDot={{ r: 5 }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}