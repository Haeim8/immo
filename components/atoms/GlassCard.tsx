"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export default function GlassCard({ children, className, hover = true, glow = false }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "relative backdrop-blur-xl bg-white/5 dark:bg-white/5",
        "border border-white/10 dark:border-white/10",
        "rounded-2xl p-6",
        "shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]",
        hover && "transition-all duration-300 hover:scale-[1.02] hover:bg-white/10",
        glow && "hover:shadow-[0_0_30px_rgba(6,182,212,0.4)]",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {glow && (
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
      )}
      {children}
    </motion.div>
  );
}
