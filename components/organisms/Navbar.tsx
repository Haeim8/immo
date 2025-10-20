"use client";

import { usePathname } from "next/navigation";
import NavLink from "@/components/molecules/NavLink";
import GradientText from "@/components/atoms/GradientText";
import SettingsDropdown from "@/components/molecules/SettingsDropdown";
import AdminLink from "@/components/molecules/AdminLink";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect } from "react";
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

export default function Navbar() {
  const pathname = usePathname();
  const [selectedNetwork, setSelectedNetwork] = useState("devnet");
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
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-background/50 border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">U</span>
              </div>
              <GradientText className="text-xl font-bold" animate={false}>
                USCI
              </GradientText>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <NavLink href="/" active={pathname === "/"}>
                {navT("home")}
              </NavLink>
              <NavLink href="/portfolio" active={pathname === "/portfolio"}>
                {navT("portfolio")}
              </NavLink>
              <NavLink href="/leaderboard" active={pathname === "/leaderboard"}>
                {navT("leaderboard")}
              </NavLink>
              <NavLink href="/performance" active={pathname === "/performance"}>
                {navT("performance")}
              </NavLink>
              <NavLink href="/waitlist" active={pathname === "/waitlist"}>
                <span className="relative">
                  {navT("waitlist")}
                  <span className="absolute -top-1 -right-6 px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-purple-500 to-pink-600 rounded-full">
                    {navT("waitlistBadge")}
                  </span>
                </span>
              </NavLink>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Admin Link (only visible for admins or team members) - Hidden on mobile */}
            {isConnected && canAccessAdmin && <AdminLink isAdmin={canAccessAdmin} className="hidden sm:flex" />}

            {/* Network Selector - Solana - Hidden on mobile */}
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="hidden sm:flex w-[140px] bg-white/5 border-white/10">
                <div className="flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 397.7 311.7" className="shrink-0">
                    <defs>
                      <linearGradient id="solanaGradient" x1="360.88" y1="351.46" x2="141.21" y2="-69.29" gradientUnits="userSpaceOnUse">
                        <stop offset="0" stopColor="#00ffa3"/>
                        <stop offset="1" stopColor="#dc1fff"/>
                      </linearGradient>
                    </defs>
                    <path fill="url(#solanaGradient)" d="M64.6,237.9c2.4-2.4,5.7-3.8,9.2-3.8h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,237.9z"/>
                    <path fill="url(#solanaGradient)" d="M64.6,3.8C67.1,1.4,70.4,0,73.8,0h317.4c5.8,0,8.7,7,4.6,11.1l-62.7,62.7c-2.4,2.4-5.7,3.8-9.2,3.8H6.5c-5.8,0-8.7-7-4.6-11.1L64.6,3.8z"/>
                    <path fill="url(#solanaGradient)" d="M333.1,120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8,0-8.7,7-4.6,11.1l62.7,62.7c2.4,2.4,5.7,3.8,9.2,3.8h317.4c5.8,0,8.7-7,4.6-11.1L333.1,120.1z"/>
                  </svg>
                  <SelectValue />
                </div>
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

            {/* Theme Toggle - Hidden on mobile */}
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            {/* Connect Wallet Button - Compact on mobile */}
            {!isConnected ? (
              <AnimatedButton
                variant="primary"
                size="sm"
                onClick={handleConnect}
                disabled={connecting}
                className="text-xs sm:text-sm"
              >
                <Wallet className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">{commonT("connectWallet")}</span>
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

            {/* Settings Dropdown - Hidden on mobile */}
            <div className="hidden sm:block">
              <SettingsDropdown />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
