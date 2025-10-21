"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/atoms/GlassCard";
import GradientText from "@/components/atoms/GradientText";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { Globe, Palette, Bell, Shield, Mail } from "lucide-react";

export default function SettingsPage() {
  const [language, setLanguage] = useState("fr");
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);

  return (
    <div className="min-h-screen">

      <main className="pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h1 className="text-5xl font-bold mb-4">
              <GradientText>Settings</GradientText>
            </h1>
            <p className="text-muted-foreground text-lg">
              Customize your platform experience
            </p>
          </motion.div>

          <div className="space-y-6">
            {/* Language Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Globe className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Language & Currency</h2>
                    <p className="text-sm text-muted-foreground">
                      Select your preferred language and currency
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div>
                      <p className="font-medium">Interface Language</p>
                      <p className="text-sm text-muted-foreground">
                        Application display
                      </p>
                    </div>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div>
                      <p className="font-medium">Theme</p>
                      <p className="text-sm text-muted-foreground">
                        Choose between light and dark mode
                      </p>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Notifications Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Bell className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Notifications</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage your notification preferences
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive alerts for new investments
                      </p>
                    </div>
                    <AnimatedButton
                      variant={notifications ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setNotifications(!notifications)}
                    >
                      {notifications ? "Enabled" : "Disabled"}
                    </AnimatedButton>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div>
                      <p className="font-medium">Dividend Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Be notified when dividends are distributed
                      </p>
                    </div>
                    <AnimatedButton variant="primary" size="sm">
                      Enabled
                    </AnimatedButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Email Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Mail className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Email</h2>
                    <p className="text-sm text-muted-foreground">
                      Email communication settings
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div>
                      <p className="font-medium">Newsletter</p>
                      <p className="text-sm text-muted-foreground">
                        Receive latest news and opportunities
                      </p>
                    </div>
                    <AnimatedButton
                      variant={emailUpdates ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setEmailUpdates(!emailUpdates)}
                    >
                      {emailUpdates ? "Enabled" : "Disabled"}
                    </AnimatedButton>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div>
                      <p className="font-medium">Monthly Reports</p>
                      <p className="text-sm text-muted-foreground">
                        Monthly portfolio summary
                      </p>
                    </div>
                    <AnimatedButton variant="primary" size="sm">
                      Enabled
                    </AnimatedButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Security Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <Shield className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Security</h2>
                    <p className="text-sm text-muted-foreground">
                      Security and privacy settings
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security
                      </p>
                    </div>
                    <AnimatedButton variant="outline" size="sm">
                      Configure
                    </AnimatedButton>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                    <div>
                      <p className="font-medium">Connected Wallet</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
                      </p>
                    </div>
                    <AnimatedButton variant="outline" size="sm">
                      Disconnect
                    </AnimatedButton>
                  </div>
                </div>
              </GlassCard>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-end gap-3 pt-6"
            >
              <AnimatedButton variant="outline">
                Cancel
              </AnimatedButton>
              <AnimatedButton variant="primary">
                Save Changes
              </AnimatedButton>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
