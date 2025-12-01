"use client";

import { motion } from "framer-motion";
import { Globe, Bell, Shield, Mail, Sun, Moon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "next-themes";
import { useTranslations } from "@/components/providers/IntlProvider";
import { useAccount } from "wagmi";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const settingsT = useTranslations("settings");
  const { address, isConnected } = useAccount();

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex-1 py-6 md:py-8">
      <div className="container-app max-w-3xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="mb-2">{settingsT("title")}</h1>
          <p className="text-muted-foreground">
            {settingsT("subtitle")}
          </p>
        </motion.div>

        {/* Language & Appearance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-vault"
        >
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">{settingsT("languageTitle")}</h2>
                <p className="text-sm text-muted-foreground">
                  {settingsT("languageSubtitle")}
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {/* Language Select */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
              <div>
                <p className="font-medium">{settingsT("languageLabel")}</p>
                <p className="text-sm text-muted-foreground">
                  {settingsT("languageDescription")}
                </p>
              </div>
              <Select defaultValue="fr">
                <SelectTrigger className="w-[160px] bg-card border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Francais</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Espanol</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
              <div>
                <p className="font-medium">{settingsT("themeLabel")}</p>
                <p className="text-sm text-muted-foreground">
                  {settingsT("themeDescription")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTheme("light")}
                  className={`p-2.5 rounded-lg transition-all ${
                    theme === "light"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border hover:bg-secondary"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`p-2.5 rounded-lg transition-all ${
                    theme === "dark"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border hover:bg-secondary"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-vault"
        >
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h2 className="font-semibold">{settingsT("notificationsTitle")}</h2>
                <p className="text-sm text-muted-foreground">
                  {settingsT("notificationsSubtitle")}
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
              <div>
                <p className="font-medium">{settingsT("pushLabel")}</p>
                <p className="text-sm text-muted-foreground">
                  {settingsT("pushDescription")}
                </p>
              </div>
              <button className="btn-primary text-sm py-2">
                {settingsT("enabled")}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
              <div>
                <p className="font-medium">{settingsT("dividendsLabel")}</p>
                <p className="text-sm text-muted-foreground">
                  {settingsT("dividendsDescription")}
                </p>
              </div>
              <button className="btn-primary text-sm py-2">
                {settingsT("enabled")}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-vault"
        >
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="font-semibold">{settingsT("emailTitle")}</h2>
                <p className="text-sm text-muted-foreground">
                  {settingsT("emailSubtitle")}
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
              <div>
                <p className="font-medium">{settingsT("newsletterLabel")}</p>
                <p className="text-sm text-muted-foreground">
                  {settingsT("newsletterDescription")}
                </p>
              </div>
              <button className="btn-primary text-sm py-2">
                {settingsT("enabled")}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
              <div>
                <p className="font-medium">{settingsT("reportsLabel")}</p>
                <p className="text-sm text-muted-foreground">
                  {settingsT("reportsDescription")}
                </p>
              </div>
              <button className="btn-primary text-sm py-2">
                {settingsT("enabled")}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-vault"
        >
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="font-semibold">Security</h2>
                <p className="text-sm text-muted-foreground">
                  Security and privacy settings
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security
                </p>
              </div>
              <button className="btn-secondary text-sm py-2">
                Configure
              </button>
            </div>

            {isConnected && address && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                <div>
                  <p className="font-medium">Connected Wallet</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {shortenAddress(address)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-sm text-success font-medium">Connected</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
