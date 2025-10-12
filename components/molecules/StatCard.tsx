"use client";

import { LucideIcon } from "lucide-react";
import GlassCard from "@/components/atoms/GlassCard";
import MetricDisplay from "@/components/atoms/MetricDisplay";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconColor?: string;
  delay?: number;
}

export default function StatCard({ icon, label, value, iconColor, delay }: StatCardProps) {
  return (
    <GlassCard hover glow>
      <MetricDisplay
        icon={icon}
        label={label}
        value={value}
        iconColor={iconColor}
        delay={delay}
      />
    </GlassCard>
  );
}
