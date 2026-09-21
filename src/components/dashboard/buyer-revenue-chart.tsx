"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatMoneyCompact } from "@/lib/utils/format";

export function BuyerRevenueChart({ data }: { data: { buyerName: string; value: number }[] }) {
  const top = [...data].sort((a, b) => b.value - a.value).slice(0, 6);

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={top} layout="vertical" margin={{ top: 5, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
        <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickFormatter={(v) => formatMoneyCompact(v)} />
        <YAxis type="category" dataKey="buyerName" width={130} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
          formatter={(value) => formatMoneyCompact(Number(value))}
        />
        <Bar dataKey="value" name="Order value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
