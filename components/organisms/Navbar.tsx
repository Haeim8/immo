"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import NavLink from "@/components/molecules/NavLink";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import GradientText from "@/components/atoms/GradientText";
import SettingsDropdown from "@/components/molecules/SettingsDropdown";
import AdminLink from "@/components/molecules/AdminLink";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Navbar() {
  const pathname = usePathname();
  const [isConnected, setIsConnected] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("ethereum");

  const handleConnectWallet = () => {
    setIsConnected(!isConnected);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-background/50 border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <GradientText className="text-xl font-bold" animate={false}>
                BrickChain
              </GradientText>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <NavLink href="/" active={pathname === "/"}>
                Home
              </NavLink>
              <NavLink href="/portfolio" active={pathname === "/portfolio"}>
                Portfolio
              </NavLink>
              <NavLink href="/leaderboard" active={pathname === "/leaderboard"}>
                Leaderboard
              </NavLink>
              <NavLink href="/performance" active={pathname === "/performance"}>
                Performance
              </NavLink>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Admin Link (only visible for admins) */}
            <AdminLink isAdmin={true} />

            {/* Network Selector */}
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="w-[130px] bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="bsc">BSC</SelectItem>
                <SelectItem value="arbitrum">Arbitrum</SelectItem>
              </SelectContent>
            </Select>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Connect Wallet Button */}
            <AnimatedButton
              variant={isConnected ? "outline" : "primary"}
              size="sm"
              onClick={handleConnectWallet}
            >
              <Wallet className="h-4 w-4 mr-2" />
              {isConnected ? "0x742d...f0bEb" : "Connect"}
            </AnimatedButton>

            {/* Settings Dropdown */}
            <SettingsDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
}
