"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavLink from "@/components/molecules/NavLink";
import SettingsDropdown from "@/components/molecules/SettingsDropdown";
import AdminLink from "@/components/molecules/AdminLink";
import { Wallet, LogOut, X, Home, Trophy, BarChart3, Menu } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function HeaderContent() {
  const pathname = usePathname();
  const [selectedNetwork, setSelectedNetwork] = useState<"sepolia" | "mainnet">("sepolia");
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
    { href: "/portfolio", label: navT("portfolio"), icon: Wallet },
    { href: "/leaderboard", label: navT("leaderboard"), icon: Trophy },
    { href: "/performance", label: navT("performance"), icon: BarChart3 },
  ];

  return (
    <>
      <div className="w-full h-full px-4 md:px-6 flex items-center justify-between">
        
        {/* 1. Logo & Brand */}
        <div className="flex items-center gap-4">
          <Link href="/home" className="relative block h-9 w-9 md:h-10 md:w-10 hover:opacity-80 transition-opacity">
            <Image src="/logo-light.png" alt="Logo" fill className="block dark:hidden object-contain" />
            <Image src="/logo-dark.png" alt="Logo" fill className="hidden dark:block object-contain" />
          </Link>
          
          {/* Desktop Navigation (Capsule Style) */}
          <nav className="hidden lg:flex items-center p-1 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm ml-4">
            {menuItems.map((item) => {
               const isActive = pathname === item.href;
               return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300",
                    isActive 
                      ? "bg-primary/10 text-primary shadow-[0_0_15px_rgba(var(--primary),0.3)] border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {item.label}
                </Link>
               );
            })}
          </nav>
        </div>

        {/* 2. Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* Admin Link */}
          {isConnected && canAccessAdmin && (
             <div className="hidden md:block">
               <AdminLink isAdmin={canAccessAdmin} />
             </div>
          )}

          {/* Network Switcher */}
          <div className="hidden md:block">
            <Select value={selectedNetwork} onValueChange={(v: any) => setSelectedNetwork(v)}>
              <SelectTrigger className="h-9 bg-black/20 border-white/10 text-xs font-medium rounded-full px-3 hover:bg-black/40 transition-colors focus:ring-0 focus:ring-offset-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10">
                <SelectItem value="sepolia">Base Sepolia</SelectItem>
                <SelectItem value="mainnet">Base Mainnet</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                      className="relative group overflow-hidden rounded-full px-5 py-2 bg-primary text-primary-foreground text-sm font-bold transition-all hover:shadow-[0_0_20px_rgba(var(--primary),0.5)]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <span className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        <span className="hidden md:inline">{commonT("connectWallet")}</span>
                        <span className="md:hidden">Connect</span>
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={openAccountModal}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all group"
                      >
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                        <span className="text-sm font-medium group-hover:text-primary transition-colors">
                          {account.displayName}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>

          <SettingsDropdown />

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-full bg-white/5 hover:bg-white/10 text-foreground transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-[300px] bg-background border-l border-white/10 z-[70] lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
                <span className="font-bold text-lg tracking-tight">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-full hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3 rounded-xl transition-all",
                        isActive 
                          ? "bg-primary/10 border border-primary/20 text-primary" 
                          : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                
                {isConnected && canAccessAdmin && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <AdminLink isAdmin={canAccessAdmin} />
                    </div>
                )}
              </div>

              <div className="p-4 border-t border-white/10 bg-white/5">
                {isConnected && (
                    <button 
                        onClick={() => disconnect()}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Deconnexion
                    </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}