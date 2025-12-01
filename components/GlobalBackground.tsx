"use client";

import { motion } from "framer-motion";

export default function GlobalBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Subtle grain texture */}
      <div className="absolute inset-0 grain-texture opacity-30" />

      {/* Animated geometric lines - full viewport */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Floating horizontal lines - slow animation */}
        <motion.line
          x1="0" y1="250" x2="1920" y2="250"
          stroke="hsl(var(--primary) / 0.08)"
          strokeWidth="0.5"
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.4, 0.1], y: [0, 15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.line
          x1="0" y1="450" x2="1920" y2="450"
          stroke="hsl(var(--accent) / 0.06)"
          strokeWidth="0.5"
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.35, 0.1], y: [0, -10, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.line
          x1="0" y1="650" x2="1920" y2="650"
          stroke="hsl(var(--primary) / 0.06)"
          strokeWidth="0.5"
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.3, 0.1], y: [0, 12, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
        <motion.line
          x1="0" y1="850" x2="1920" y2="850"
          stroke="hsl(var(--accent) / 0.05)"
          strokeWidth="0.5"
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.25, 0.1], y: [0, -8, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 6 }}
        />

        {/* Elegant curves - slow undulating motion */}
        <motion.path
          d="M 0 500 Q 480 380 960 500 T 1920 450"
          fill="none"
          stroke="hsl(var(--primary) / 0.1)"
          strokeWidth="1"
          initial={{ pathLength: 1, opacity: 0.2 }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
            d: [
              "M 0 500 Q 480 380 960 500 T 1920 450",
              "M 0 520 Q 480 420 960 480 T 1920 470",
              "M 0 500 Q 480 380 960 500 T 1920 450"
            ]
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.path
          d="M 0 350 Q 600 250 1200 350 T 1920 300"
          fill="none"
          stroke="hsl(var(--accent) / 0.08)"
          strokeWidth="0.5"
          initial={{ pathLength: 1, opacity: 0.15 }}
          animate={{
            opacity: [0.15, 0.4, 0.15],
            d: [
              "M 0 350 Q 600 250 1200 350 T 1920 300",
              "M 0 330 Q 600 290 1200 330 T 1920 320",
              "M 0 350 Q 600 250 1200 350 T 1920 300"
            ]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        <motion.path
          d="M 0 700 Q 400 600 800 700 T 1920 650"
          fill="none"
          stroke="hsl(var(--primary) / 0.08)"
          strokeWidth="0.5"
          initial={{ pathLength: 1, opacity: 0.15 }}
          animate={{
            opacity: [0.15, 0.35, 0.15],
            d: [
              "M 0 700 Q 400 600 800 700 T 1920 650",
              "M 0 720 Q 400 650 800 680 T 1920 670",
              "M 0 700 Q 400 600 800 700 T 1920 650"
            ]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        />

        {/* Very subtle floating dots - slow drift */}
        <motion.circle
          cx="300" cy="300"
          r="2"
          fill="hsl(var(--primary))"
          initial={{ opacity: 0.2 }}
          animate={{ opacity: [0.2, 0.5, 0.2], y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="1600" cy="500"
          r="2"
          fill="hsl(var(--accent))"
          initial={{ opacity: 0.15 }}
          animate={{ opacity: [0.15, 0.4, 0.15], y: [0, 15, 0], x: [0, -8, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />
        <motion.circle
          cx="900" cy="200"
          r="1.5"
          fill="hsl(var(--primary))"
          initial={{ opacity: 0.15 }}
          animate={{ opacity: [0.15, 0.35, 0.15], y: [0, 12, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <motion.circle
          cx="500" cy="800"
          r="2"
          fill="hsl(var(--accent))"
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.3, 0.1], y: [0, -15, 0], x: [0, 5, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 6 }}
        />
        <motion.circle
          cx="1400" cy="750"
          r="1.5"
          fill="hsl(var(--primary))"
          initial={{ opacity: 0.1 }}
          animate={{ opacity: [0.1, 0.3, 0.1], x: [0, -10, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 8 }}
        />
      </svg>
    </div>
  );
}
