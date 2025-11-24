"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

const defaultData = [
  { name: "Jan", value: 4.5 },
  { name: "Feb", value: 5.2 },
  { name: "Mar", value: 4.8 },
  { name: "Apr", value: 6.1 },
  { name: "May", value: 5.9 },
  { name: "Jun", value: 6.5 },
  { name: "Jul", value: 7.2 },
  { name: "Aug", value: 7.8 },
  { name: "Sep", value: 8.1 },
  { name: "Oct", value: 8.3 },
  { name: "Nov", value: 8.45 },
];

interface VaultChartProps {
  color: string;
  label: string;
}

export function VaultChart({ color, label }: VaultChartProps) {
  const gradientId = `vault-gradient-${color.replace(/[^a-zA-Z0-9]/g, "") || "primary"}`;

  return (
    <div className="w-full h-full">
      <div className="text-xs font-medium text-muted-foreground mb-2 text-center">{label}</div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={defaultData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis dataKey="name" hide />
          <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm text-xs font-medium">
                    <span className="text-muted-foreground">{payload[0].payload.name}: </span>
                    <span style={{ color }}>{payload[0].value}%</span>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
