"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes } from "react";

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export default function AnimatedButton({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: AnimatedButtonProps) {
  const variants = {
    primary: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/50",
    outline: "border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500/10",
    ghost: "hover:bg-white/10 text-foreground",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      className={cn(
        "relative rounded-xl font-semibold transition-all duration-300",
        "backdrop-blur-sm",
        variants[variant],
        sizes[size],
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
