"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SettingsDropdown from "@/components/molecules/SettingsDropdown";
import AdminLink from "@/components/molecules/AdminLink";
import { Wallet, LogOut, X, Home, Trophy, BarChart3, ChevronRight, Coins, Settings, Menu, type LucideIcon } from "lucide-react";
import { DiscordLogoIcon, TwitterLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { BuyCryptoButton } from "@/components/buy-crypto-button";
import { useWalletAddress, useIsAdmin, useIsTeamMember } from "@/lib/evm/hooks";
import { useTranslations } from "@/components/providers/IntlProvider";
import { useDisconnect } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Network icons as SVG components
const BaseIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 111 111" fill="none" className={className}>
    <circle cx="55.5" cy="55.5" r="55.5" fill="#0052FF"/>
    <path d="M55.5 93C76.2107 93 93 76.2107 93 55.5C93 34.7893 76.2107 18 55.5 18C35.5049 18 19.1958 33.6686 18.0303 53.3936H71.5294V57.6064H18.0303C19.1958 77.3314 35.5049 93 55.5 93Z" fill="white"/>
  </svg>
);

// Social links for mobile drawer
const socials = [
  { href: "https://discord.gg/vPzTuH8Tj", Icon: DiscordLogoIcon, label: "Discord" },
  { href: "https://x.com/cantorfi_protocole", Icon: TwitterLogoIcon, label: "X" },
  { href: "https://github.com/cantorfi", Icon: GitHubLogoIcon, label: "GitHub" },
];

const legalLinks = [
  { href: "/cgv", label: "CGV" },
  { href: "/cgu", label: "CGU" },
];

// Mobile Drawer Portal Component
function MobileDrawer({
  isOpen,
  onClose,
  menuItems,
  pathname,
  isConnected,
  canAccessAdmin,
  disconnect,
  navT,
  commonT,
  selectedNetwork
}: {
  isOpen: boolean;
  onClose: () => void;
  menuItems: { href: string; label: string; icon: LucideIcon }[];
  pathname: string;
  isConnected: boolean;
  canAccessAdmin: boolean;
  disconnect: () => void;
  navT: (key: string) => string;
  commonT: (key: string) => string;
  selectedNetwork: "sepolia" | "mainnet";
}) {
  const [mounted, setMounted] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted) return null;

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Drawer - FROM LEFT */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-[300px] max-w-[85vw] bg-card border-r border-border z-[9999] flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9">
                  <Image src="/logo-dark.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="font-bold text-lg text-foreground">CantorFi</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Link>
                );
              })}

              {/* Settings link on mobile */}
              <Link
                href="/settings"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  pathname === "/settings"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">{navT("settings") || "Settings"}</span>
              </Link>

              {isConnected && canAccessAdmin && (
                <div className="pt-4 mt-4 border-t border-border">
                  <AdminLink isAdmin={canAccessAdmin} />
                </div>
              )}
            </div>

            {/* Footer in Mobile Drawer */}
            <div className="mt-auto border-t border-border">
              {/* Network Info */}
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary/30">
                  <BaseIcon className="w-5 h-5" />
                  <span className="text-sm text-foreground font-medium">
                    {selectedNetwork === "sepolia" ? "Base Sepolia" : "Base Mainnet"}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">Testnet</span>
                </div>
              </div>

              {/* Social Links */}
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-center gap-2">
                  {socials.map(({ href, Icon, label }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-all"
                      title={label}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Legal & Copyright */}
              <div className="p-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>© {currentYear} CantorFi</span>
                <div className="flex items-center gap-3">
                  {legalLinks.map(({ href, label }) => (
                    <Link
                      key={label}
                      href={href}
                      onClick={onClose}
                      className="hover:text-foreground transition-colors"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Disconnect Button */}
              {isConnected && (
                <div className="p-4 pt-0">
                  <button
                    onClick={() => {
                      disconnect();
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    {commonT("disconnect") || "Disconnect"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render drawer at document body level
  return createPortal(drawerContent, document.body);
}

export default function HeaderContent() {
  const pathname = usePathname();
  const [selectedNetwork] = useState<"sepolia" | "mainnet">("sepolia");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navT = useTranslations("navbar");
  const commonT = useTranslations("common");

  const { address, isConnected } = useWalletAddress();
  const { disconnect } = useDisconnect();
  const { isAdmin } = useIsAdmin(address);
  const { isTeamMember } = useIsTeamMember(address);
  const canAccessAdmin = isAdmin || (isTeamMember ?? false);

  const menuItems = [
    { href: "/home", label: navT("home"), icon: Home },
    { href: "/staking", label: "Staking", icon: Coins },
    { href: "/portfolio", label: navT("portfolio"), icon: Wallet },
    { href: "/leaderboard", label: navT("leaderboard"), icon: Trophy },
    { href: "/performance", label: navT("performance"), icon: BarChart3 },
  ];

  return (
    <>
      <div className="w-full h-full px-4 md:px-6 flex items-center justify-between">

        {/* Left: Logo + Mobile Menu Arrow */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Toggle - Hamburger icon */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/home" className="relative block h-9 w-9 md:h-10 md:w-10 hover:opacity-80 transition-opacity">
            <Image src="/logo-light.png" alt="Logo" fill className="block dark:hidden object-contain" />
            <Image src="/logo-dark.png" alt="Logo" fill className="hidden dark:block object-contain" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 ml-6">
            {menuItems.map((item) => {
               const isActive = pathname === item.href;
               return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  {item.label}
                </Link>
               );
            })}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* Admin Link */}
          {isConnected && canAccessAdmin && (
             <div className="hidden md:block">
               <AdminLink isAdmin={canAccessAdmin} />
             </div>
          )}

          {/* Network Indicator - Icon only */}
          <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg bg-secondary/50 border border-border/50 hover:border-border transition-colors cursor-default" title={selectedNetwork === "sepolia" ? "Base Sepolia" : "Base Mainnet"}>
            <BaseIcon className="w-5 h-5" />
          </div>

          {/* Buy Crypto - Onramp */}
          <BuyCryptoButton />

          {/* Wallet Connection */}
          <ConnectButton.Custom>
            {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div className={!ready ? 'opacity-0 pointer-events-none' : ''}>
                  {!connected ? (
                    <button
                      onClick={openConnectModal}
                      className="btn-primary text-sm"
                    >
                      <Wallet className="w-4 h-4" />
                      <span className="hidden sm:inline">{commonT("connectWallet")}</span>
                      <span className="sm:hidden">Connect</span>
                    </button>
                  ) : (
                    <button
                      onClick={openAccountModal}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50 hover:border-primary/30 hover:bg-secondary transition-all"
                    >
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-sm font-medium">
                        {account.displayName}
                      </span>
                    </button>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>

          <SettingsDropdown />
        </div>
      </div>

      {/* Mobile Drawer - Rendered via Portal */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        menuItems={menuItems}
        pathname={pathname}
        isConnected={isConnected}
        canAccessAdmin={canAccessAdmin}
        disconnect={disconnect}
        navT={navT}
        commonT={commonT}
        selectedNetwork={selectedNetwork}
      />
    </>
  );
}
