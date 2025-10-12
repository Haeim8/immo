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
import { Wallet, Menu, Settings } from "lucide-react";
import PortfolioSidebar from "@/components/portfolio-sidebar";
import Link from "next/link";

export default function Header() {
  const [isConnected, setIsConnected] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState("ethereum");
  const [selectedLanguage, setSelectedLanguage] = useState("fr");

  const handleConnectWallet = () => {
    setIsConnected(!isConnected);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
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

            {/* Network Selector */}
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="w-[140px]">
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

            {/* Settings Button */}
            <Link href="/settings">
              <Button variant="outline" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>

            {/* Connect Wallet Button */}
            <Button
              onClick={handleConnectWallet}
              className="gap-2"
              variant={isConnected ? "outline" : "default"}
            >
              <Wallet className="h-4 w-4" />
              {isConnected ? "0x742d...f0bEb" : "Connect Wallet"}
            </Button>

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
