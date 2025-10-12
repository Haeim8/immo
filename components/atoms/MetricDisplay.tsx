"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricDisplayProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconColor?: string;
  delay?: number;
}

export default function MetricDisplay({
  icon: Icon,
  label,
  value,
  iconColor = "text-cyan-400",
  delay = 0,
}: MetricDisplayProps) {
  return (
    <motion.div
      className="flex items-center gap-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className={cn(
        "p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20",
        "backdrop-blur-sm border border-white/10",
        iconColor
      )}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
          {value}
        </p>
      </div>
    </motion.div>
  );
}
