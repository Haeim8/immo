"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { motion } from "framer-motion";

interface AdminLinkProps {
  isAdmin?: boolean;
}

export default function AdminLink({ isAdmin = true }: AdminLinkProps) {
  if (!isAdmin) return null;

  return (
    <Link href="/admin">
      <motion.div
        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
        <span className="text-xs sm:text-sm font-medium text-purple-400">Admin</span>
      </motion.div>
    </Link>
  );
}
