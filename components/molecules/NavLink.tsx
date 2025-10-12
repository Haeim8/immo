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
    <Link href={href}>
      <motion.span
        className={cn(
          "relative px-4 py-2 text-sm font-medium transition-colors",
          active ? "text-cyan-400" : "text-muted-foreground hover:text-foreground"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
        {active && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-600"
            layoutId="nav-indicator"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
        )}
      </motion.span>
    </Link>
  );
}
