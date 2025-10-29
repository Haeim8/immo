"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavLink from "@/components/molecules/NavLink";
import SettingsDropdown from "@/components/molecules/SettingsDropdown";
import AdminLink from "@/components/molecules/AdminLink";
import { Wallet, LogOut } from "lucide-react";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWalletAddress, useIsAdmin, useIsTeamMember } from "@/lib/evm/hooks";
import { useTranslations } from "@/components/providers/IntlProvider";
import { useDisconnect } from "wagmi";

export default function HeaderContent() {
  const pathname = usePathname();
  const [selectedNetwork, setSelectedNetwork] = useState<"sepolia" | "mainnet">("sepolia");
  const navT = useTranslations("navbar");
  const commonT = useTranslations("common");

  const { address, isConnected } = useWalletAddress();
  const { disconnect } = useDisconnect();

  // Check admin and team status
  const { isAdmin } = useIsAdmin(address);
  const { isTeamMember } = useIsTeamMember(address);

  const canAccessAdmin = isAdmin || (isTeamMember ?? false);

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


          {/* Connect Wallet Button - RainbowKit */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== 'loading';
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === 'authenticated');

              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    'style': {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <AnimatedButton
                          onClick={openConnectModal}
                          variant="primary"
                          size="sm"
                          className="text-sm whitespace-nowrap flex-shrink-0 !px-3 !py-2"
                        >
                          <Wallet className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-shrink-0">{commonT("connectWallet")}</span>
                        </AnimatedButton>
                      );
                    }

                    return (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={openAccountModal}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs sm:text-sm font-medium hover:bg-white/10 transition-colors"
                        >
                          <Wallet className="h-3 w-3 inline mr-1" />
                          {account.displayName || `${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                        </button>
                        <button
                          onClick={() => disconnect()}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs sm:text-sm font-medium hover:bg-red-500/20 transition-colors text-red-400"
                          title="Disconnect"
                        >
                          <LogOut className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>

          {/* Settings Dropdown - Visible on mobile */}
          <SettingsDropdown />
        </div>
      </div>
    </div>
  );
}
