"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavLink from "@/components/molecules/NavLink";
import SettingsDropdown from "@/components/molecules/SettingsDropdown";
import AdminLink from "@/components/molecules/AdminLink";
import { Wallet } from "lucide-react";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { useIsAdmin, useIsTeamMember } from "@/lib/evm/hooks";
import { useTranslations } from "@/components/providers/IntlProvider";

export default function HeaderContent() {
  const pathname = usePathname();
  const [selectedNetwork, setSelectedNetwork] = useState<"sepolia" | "mainnet">("sepolia");
  const navT = useTranslations("navbar");
  const commonT = useTranslations("common");

  // Privy Wallet
  const { login, logout, ready } = usePrivy();
  const { address, isConnected } = useAccount();

  // Check admin and team status
  const { isAdmin } = useIsAdmin(address);
  const { isTeamMember } = useIsTeamMember(address);

  const canAccessAdmin = isAdmin || (isTeamMember ?? false);

  // Handle connect button click
  const handleConnect = () => {
    login();
  };

  // Handle disconnect
  const handleDisconnect = () => {
    logout();
  };

  return (
    <div className="w-full h-full px-2 sm:px-6 flex items-center">
      <div className="flex w-full items-center gap-2 sm:gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-none">
          <span className="relative block h-12 w-12 md:h-16 md:w-16">
            <Image
              src="/logo-light.png"
              alt="USCI logo light theme"
              fill
              sizes="64px"
              priority
              className="block dark:hidden object-contain"
            />
            <Image
              src="/logo-dark.png"
              alt="USCI logo dark theme"
              fill
              sizes="64px"
              priority
              className="hidden dark:block object-contain"
            />
          </span>
        </Link>

        {/* Navigation Links - centered */}
        <div className="flex-1 flex justify-start min-w-0 pl-12">
          <div className="hidden md:flex items-stretch gap-2 p-1.5 rounded-3xl backdrop-blur-xl bg-muted/40 border border-border/50 shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] max-w-full">
            <NavLink href="/" active={pathname === "/"}>
              <div className={`px-5 py-2.5 rounded-2xl transition-all duration-300 ${pathname === "/" ? "bg-background/90 backdrop-blur-sm shadow-[0_4px_16px_0_rgba(255,255,255,0.2)]" : "hover:bg-background/40"}`}>
                <span className={`text-sm font-medium ${pathname === "/" ? "text-foreground" : "text-muted-foreground"}`}>
                  {navT("home")}
                </span>
              </div>
            </NavLink>
            <NavLink href="/portfolio" active={pathname === "/portfolio"}>
              <div className={`px-5 py-2.5 rounded-2xl transition-all duration-300 ${pathname === "/portfolio" ? "bg-background/90 backdrop-blur-sm shadow-[0_4px_16px_0_rgba(255,255,255,0.2)]" : "hover:bg-background/40"}`}>
                <span className={`text-sm font-medium ${pathname === "/portfolio" ? "text-foreground" : "text-muted-foreground"}`}>
                  {navT("portfolio")}
                </span>
              </div>
            </NavLink>
            <NavLink href="/leaderboard" active={pathname === "/leaderboard"}>
              <div className={`px-5 py-2.5 rounded-2xl transition-all duration-300 ${pathname === "/leaderboard" ? "bg-background/90 backdrop-blur-sm shadow-[0_4px_16px_0_rgba(255,255,255,0.2)]" : "hover:bg-background/40"}`}>
                <span className={`text-sm font-medium ${pathname === "/leaderboard" ? "text-foreground" : "text-muted-foreground"}`}>
                  {navT("leaderboard")}
                </span>
              </div>
            </NavLink>
            <NavLink href="/performance" active={pathname === "/performance"}>
              <div className={`px-5 py-2.5 rounded-2xl transition-all duration-300 ${pathname === "/performance" ? "bg-background/90 backdrop-blur-sm shadow-[0_4px_16px_0_rgba(255,255,255,0.2)]" : "hover:bg-background/40"}`}>
                <span className={`text-sm font-medium ${pathname === "/performance" ? "text-foreground" : "text-muted-foreground"}`}>
                  {navT("performance")}
                </span>
              </div>
            </NavLink>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center justify-end gap-1 sm:gap-2 md:gap-4 flex-none">
          {/* Admin Link (only visible for admins or team members) - Hidden on mobile */}
          {isConnected && canAccessAdmin && (
            <div className="hidden md:block">
              <AdminLink isAdmin={canAccessAdmin} />
            </div>
          )}

          {/* Network Selector - Base - Hidden on mobile */}
          <div className="hidden sm:block">
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="w-auto whitespace-nowrap bg-white/5 border-white/10 px-2 md:px-3 text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="sepolia">
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 111 111" fill="none">
                    <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
                    <path d="M55.5 111C86.1518 111 111 86.1518 111 55.5C111 24.8482 86.1518 0 55.5 0C24.8482 0 0 24.8482 0 55.5C0 86.1518 24.8482 111 55.5 111Z" fill="#0052FF"/>
                  </svg>
                  Base Sepolia
                </div>
              </SelectItem>
              <SelectItem value="mainnet">
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 111 111" fill="none">
                    <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
                  </svg>
                  Base Mainnet
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          </div>


          {/* Connect Wallet Button - Responsive */}
          {!isConnected || !ready ? (
            <AnimatedButton
              variant="primary"
              size="sm"
              onClick={handleConnect}
              disabled={!ready}
              className="text-sm whitespace-nowrap flex-shrink-0 !px-3 !py-2"
            >
              <Wallet className="h-4 w-4 flex-shrink-0" />
              <span className="flex-shrink-0">{commonT("connectWallet")}</span>
            </AnimatedButton>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs sm:text-sm font-medium">
                <Wallet className="h-3 w-3 inline mr-1" />
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "•"}
              </div>
              <AnimatedButton
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                <span className="hidden sm:inline">{commonT("disconnect")}</span>
                <span className="sm:hidden">×</span>
              </AnimatedButton>
            </div>
          )}

          {/* Settings Dropdown - Visible on mobile */}
          <SettingsDropdown />
        </div>
      </div>
    </div>
  );
}
