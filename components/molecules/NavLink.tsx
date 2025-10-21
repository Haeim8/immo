"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}

export default function NavLink({ href, children, active }: NavLinkProps) {
  return (
    <Link href={href} className="block h-full">
      <motion.span
        className={cn(
          "relative inline-flex h-full items-center justify-center text-sm font-medium transition-colors",
          active ? "text-cyan-400" : "text-muted-foreground hover:text-foreground"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
        {active && (
          <motion.div
            className="absolute left-2 right-2 bottom-0 h-[6px] bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
            layoutId="nav-indicator"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </motion.span>
    </Link>
  );
}
