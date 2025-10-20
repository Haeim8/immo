"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, TrendingUp, Trophy, BarChart3, Settings } from "lucide-react";
import { useTranslations } from "@/components/providers/IntlProvider";

export default function MobileNav() {
  const pathname = usePathname();
  const navT = useTranslations("navbar");

  const navItems = [
    { href: "/", icon: Home, labelKey: "home" },
    { href: "/portfolio", icon: TrendingUp, labelKey: "portfolio" },
    { href: "/leaderboard", icon: Trophy, labelKey: "leaderboard" },
    { href: "/performance", icon: BarChart3, labelKey: "performance" },
    { href: "/waitlist", icon: Settings, labelKey: "waitlist" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive
                  ? "text-cyan-400 bg-cyan-500/10"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""}`} />
              <span className="text-[10px] font-medium">{navT(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
