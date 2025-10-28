"use client";

import { Settings as SettingsIcon, Globe, DollarSign, Palette } from "lucide-react";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useIntl, useTranslations } from "@/components/providers/IntlProvider";
import { currencyMeta, supportedCurrencies, Locale } from "@/lib/intl/dictionaries";

export default function SettingsDropdown() {
  const { language, setLanguage, currency, setCurrency } = useIntl();
  const navT = useTranslations("navbar");
  const settingsT = useTranslations("settings");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-2 rounded-xl hover:bg-white/10 transition-colors">
        <SettingsIcon className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-background/95 backdrop-blur-xl border-white/10">
        <DropdownMenuLabel className="text-cyan-400">
          {navT("settings")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />

        {/* Language */}
        <div className="px-2 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium">{settingsT("languageTitle")}</span>
          </div>
          <Select value={language} onValueChange={(value: Locale) => setLanguage(value)}>
            <SelectTrigger className="w-full bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Español</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DropdownMenuSeparator className="bg-white/10" />

        {/* Currency */}
        <div className="px-2 py-3">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium">{settingsT("currencyTitle")}</span>
          </div>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-full bg-white/5 border-white/10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedCurrencies.map((code) => (
                <SelectItem key={code} value={code}>
                  {currencyMeta[code].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DropdownMenuSeparator className="bg-white/10" />

        {/* Theme */}
        <div className="px-2 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-cyan-400" />
              <span className="text-sm font-medium">Theme</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
