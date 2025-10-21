"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { Menu, Settings } from "lucide-react";
import PortfolioSidebar from "@/components/portfolio-sidebar";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Header() {
  const [selectedLanguage, setSelectedLanguage] = useState("fr");
  const { publicKey, connected } = useWallet();

  return (
    <header className="h-[70px] bg-white flex-shrink-0 z-40 w-full border-b border-gray-300">
      <div className="container mx-auto px-4 h-full">
        <div className="flex h-full items-center justify-between">
          {/* Logo / Project Name */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-turquoise-400 to-turquoise-600" />
              <span className="text-xl font-bold">SCPI Token</span>
            </Link>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">🇫🇷 FR</SelectItem>
                <SelectItem value="en">🇬🇧 EN</SelectItem>
                <SelectItem value="es">🇪🇸 ES</SelectItem>
              </SelectContent>
            </Select>

            {/* Network Display - Solana Devnet */}
            <div className="px-3 py-2 text-sm font-medium border rounded-md">
              Solana Devnet
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Settings Button */}
            <Link href="/settings">
              <Button variant="outline" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>

            {/* Solana Wallet Connect Button */}
            <WalletMultiButton className="!bg-cyan-500 hover:!bg-cyan-600" />

            {/* Portfolio Sidebar Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                <PortfolioSidebar />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
