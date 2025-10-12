"use client";

import { useState } from "react";
import { Settings as SettingsIcon, Globe, DollarSign } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SettingsDropdown() {
  const [currency, setCurrency] = useState("usd");
  const [language, setLanguage] = useState("en");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-2 rounded-xl hover:bg-white/10 transition-colors">
        <SettingsIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-background/95 backdrop-blur-xl border-white/10">
        <DropdownMenuLabel className="text-cyan-400">Settings</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />

        {/* Language */}
        <div className="px-2 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium">Language</span>
          </div>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-full bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DropdownMenuSeparator className="bg-white/10" />

        {/* Currency */}
        <div className="px-2 py-3">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium">Currency</span>
          </div>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="usd">USD ($)</SelectItem>
              <SelectItem value="eur">EUR (€)</SelectItem>
              <SelectItem value="chf">CHF (Fr)</SelectItem>
              <SelectItem value="jpy">JPY (¥)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
