"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  from?: string;
  to?: string;
  animate?: boolean;
}

export default function GradientText({
  children,
  className,
  from = "from-cyan-400",
  to = "to-blue-600",
  animate = true,
}: GradientTextProps) {
  return (
    <motion.span
      className={cn(
        "bg-gradient-to-r bg-clip-text text-transparent",
        from,
        to,
        className
      )}
      initial={animate ? { opacity: 0, y: 20 } : {}}
      animate={animate ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
    >
      {children}
    </motion.span>
  );
}
