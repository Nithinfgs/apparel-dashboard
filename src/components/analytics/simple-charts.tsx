"use client";

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatMoneyCompact } from "@/lib/utils/format";

/**
 * Value formatting is chosen by this string enum, not a function prop —
 * Server Components (every analytics page) cannot pass functions to Client
 * Components (these charts) across the RSC boundary. See AGENTS.md §2.9.
 */
type ValueFormat = "money" | "percent" | "days" | "plain";

function formatValue(v: number, format: ValueFormat = "plain"): string {
  switch (format) {
    case "money":
      return formatMoneyCompact(v);
    case "percent":
      return `${v.toFixed(0)}%`;
    case "days":
      return `${v.toFixed(0)}d`;
    default:
      return String(v);
  }
}

export function RevenueOverTimeChart({ data }: { data: { month: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
        <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => formatMoneyCompact(v)} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }} formatter={(v) => formatMoneyCompact(Number(v))} />
        <Line type="monotone" dataKey="value" name="Order Value" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBarChart({
  data,
  dataKey,
  labelKey,
  format = "plain",
  color = "var(--chart-1)",
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  labelKey: string;
  format?: ValueFormat;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 24, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => formatValue(v, format)} />
        <YAxis type="category" dataKey={labelKey} width={120} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
          formatter={(v) => formatValue(Number(v), format)}
        />
        <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VerticalBarChart({ data, dataKey, labelKey, color = "var(--chart-2)" }: { data: Record<string, unknown>[]; dataKey: string; labelKey: string; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
        <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" allowDecimals={false} />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
