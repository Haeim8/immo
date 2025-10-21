"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavLink from "@/components/molecules/NavLink";
import SettingsDropdown from "@/components/molecules/SettingsDropdown";
import AdminLink from "@/components/molecules/AdminLink";
import { usePrivy } from "@privy-io/react-auth";
import { Wallet } from "lucide-react";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { isTeamMember as checkIsTeamMember } from "@/lib/solana/team";
import { useTranslations } from "@/components/providers/IntlProvider";
import { ADMIN_WALLET } from "@/lib/config/admin";

export default function HeaderContent() {
  const pathname = usePathname();
  const [selectedNetwork, setSelectedNetwork] = useState<"mainnet" | "devnet" | "testnet">("devnet");
  const navT = useTranslations("navbar");
  const commonT = useTranslations("common");

  // Privy for EVM wallets (future)
  const { authenticated: privyAuthenticated, logout: privyLogout, user: privyUser } = usePrivy();

  // Solana Wallet Adapter for Solana wallets (current)
  const { publicKey, connected: solanaConnected, disconnect: solanaDisconnect, connecting } = useWallet();
  const { setVisible: setWalletModalVisible } = useWalletModal();
  const { connection } = useConnection();

  const [isTeamMember, setIsTeamMember] = useState(false);

  // Get wallet addresses
  const solanaWallet = publicKey?.toBase58();
  const evmWallet = privyUser?.wallet?.address;

  // Combined connection status
  const isConnected = solanaConnected || privyAuthenticated;
  const currentWallet = solanaWallet || evmWallet;

  // Enhanced debug logging
  useEffect(() => {
    if (isConnected) {
      console.log('🔍 =========================');
      console.log('🔍 Solana Wallet:', solanaWallet || 'Not connected');
      console.log('🔍 EVM Wallet (Privy):', evmWallet || 'Not connected');
      console.log('🔍 Current Wallet:', currentWallet);
      console.log('🔍 Expected ADMIN_WALLET:', ADMIN_WALLET);
      console.log('🔍 Is admin match?:', currentWallet === ADMIN_WALLET);
      console.log('🔍 =========================');
    }
  }, [isConnected, solanaWallet, evmWallet, currentWallet]);

  const isAdmin = currentWallet === ADMIN_WALLET;

  // Fetch team member status when wallet connects
  useEffect(() => {
    const checkTeamStatus = async () => {
      if (!solanaWallet || isAdmin) {
        setIsTeamMember(false);
        return;
      }

      try {
        const isMember = await checkIsTeamMember(connection, solanaWallet);
        setIsTeamMember(isMember);
        console.log('🔍 Is team member?', isMember);
      } catch (err) {
        console.error("Error checking team member status:", err);
        setIsTeamMember(false);
      }
    };

    if (solanaWallet) {
      checkTeamStatus();
    }
  }, [solanaWallet, isAdmin, connection]);

  const canAccessAdmin = isAdmin || isTeamMember;

  // Handle connect button click
  const handleConnect = () => {
    // Open Solana wallet modal
    setWalletModalVisible(true);
  };

  // Handle disconnect
  const handleDisconnect = () => {
    if (solanaConnected) {
      solanaDisconnect();
    }
    if (privyAuthenticated) {
      privyLogout();
    }
  };

  return (
    <div className="w-full h-full px-2 sm:px-6 flex items-center">
      <div className="flex w-full items-center gap-2 sm:gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center flex-none">
          <span className="relative block h-8 w-8 md:h-12 md:w-12">
            <Image
              src="/logo-light.svg"
              alt="USCI logo dark"
              fill
              sizes="48px"
              priority
              className="block dark:hidden object-contain"
            />
            <Image
              src="/logo-dark.svg"
              alt="USCI logo light"
              fill
              sizes="48px"
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

          {/* Network Selector - Solana - Hidden on mobile */}
          <div className="hidden sm:block">
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="w-auto whitespace-nowrap bg-white/5 border-white/10 px-2 md:px-3 text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="mainnet">
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 397.7 311.7">
                    <defs>
                      <linearGradient id="solGrad1" x1="360.88" y1="351.46" x2="141.21" y2="-69.29" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#00ffa3"/>
                        <stop offset="1" stopColor="#dc1fff"/>
                      </linearGradient>
                    </defs>
                    <path fill="url(#solGrad1)" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
                    <path fill="url(#solGrad1)" d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"/>
                    <path fill="url(#solGrad1)" d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"/>
                  </svg>
                  {commonT("mainnet")}
                </div>
              </SelectItem>
              <SelectItem value="devnet">
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 397.7 311.7">
                    <defs>
                      <linearGradient id="solGrad2" x1="360.88" y1="351.46" x2="141.21" y2="-69.29" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#00ffa3"/>
                        <stop offset="1" stopColor="#dc1fff"/>
                      </linearGradient>
                    </defs>
                    <path fill="url(#solGrad2)" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
                    <path fill="url(#solGrad2)" d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"/>
                    <path fill="url(#solGrad2)" d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"/>
                  </svg>
                  {commonT("devnet")}
                </div>
              </SelectItem>
              <SelectItem value="testnet">
                <div className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 397.7 311.7">
                    <defs>
                      <linearGradient id="solGrad3" x1="360.88" y1="351.46" x2="141.21" y2="-69.29" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#00ffa3"/>
                        <stop offset="1" stopColor="#dc1fff"/>
                      </linearGradient>
                    </defs>
                    <path fill="url(#solGrad3)" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
                    <path fill="url(#solGrad3)" d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"/>
                    <path fill="url(#solGrad3)" d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"/>
                  </svg>
                  {commonT("testnet")}
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          </div>


          {/* Connect Wallet Button - Responsive */}
          {!isConnected ? (
            <AnimatedButton
              variant="primary"
              size="sm"
              onClick={handleConnect}
              disabled={connecting}
              className="text-sm whitespace-nowrap flex-shrink-0 !px-3 !py-2"
            >
              <Wallet className="h-4 w-4 flex-shrink-0" />
              <span className="flex-shrink-0">{commonT("connectWallet")}</span>
            </AnimatedButton>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs sm:text-sm font-medium">
                <Wallet className="h-3 w-3 inline mr-1" />
                {currentWallet ? `${currentWallet.slice(0, 4)}...${currentWallet.slice(-3)}` : "•"}
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
