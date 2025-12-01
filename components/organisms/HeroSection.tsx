"use client";

import { motion } from "framer-motion";
import { Wallet, ArrowRight, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useAccount } from "wagmi";
import { useUserPositions, useAllVaults } from "@/lib/evm/hooks";
import Link from "next/link";
import { useTranslations } from "@/components/providers/IntlProvider";
import { ConnectButton } from "@rainbow-me/rainbowkit";

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

export default function HeroSection() {
  const { address, isConnected } = useAccount();
  const { positions, totals } = useUserPositions(address);
  const { vaults } = useAllVaults();
  const heroT = useTranslations("hero");
  const commonT = useTranslations("common");

  const hasPositions = positions.length > 0;

  // Get token symbol from vault
  const getTokenSymbol = (vaultId: number) => {
    const vault = vaults.find(v => v.vaultId === vaultId);
    return vault?.tokenSymbol || `Vault #${vaultId}`;
  };

  return (
    <section className="relative w-full py-8 md:py-12">
      <div className="relative z-10 container-app">
        {/* User Position - Full width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          {/* User Position Card - Show only if connected with positions */}
          {isConnected && hasPositions && (
            <div className="space-y-4">
              {/* Main Position Summary */}
              <Link href="/portfolio" className="block card-vault p-5 group border-primary/30 hover:border-primary/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                    <Wallet className="w-4 h-4" />
                    {heroT("yourPosition") || "Your Position"}
                  </div>
                  <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Total Supplied */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{heroT("totalSupplied") || "Total Supplied"}</p>
                    <div className="text-2xl font-bold text-success">{formatCurrency(totals.totalSupplied)}</div>
                  </div>

                  {/* Total Borrowed */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{heroT("totalBorrowed") || "Total Borrowed"}</p>
                    <div className="text-2xl font-bold text-accent">{formatCurrency(totals.totalBorrowed)}</div>
                  </div>
                </div>

                {/* Net Position */}
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{heroT("netPosition") || "Net Position"}</span>
                    <span className="text-lg font-bold text-foreground">
                      {formatCurrency(totals.totalSupplied - totals.totalBorrowed)}
                    </span>
                  </div>
                </div>

                {/* Pending Rewards */}
                {totals.totalInterestPending > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-success">{heroT("pendingRewards") || "Pending Rewards"}</span>
                      <span className="font-bold text-success">+{formatCurrency(totals.totalInterestPending)}</span>
                    </div>
                  </div>
                )}
              </Link>

              {/* Individual Positions */}
              {positions.length > 0 && (
                <div className="card-vault p-5">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                    <Activity className="w-4 h-4 text-primary" />
                    {heroT("activePositions") || "Active Positions"}
                  </div>
                  <div className="space-y-3">
                    {positions.slice(0, 3).map((position) => (
                      <Link
                        key={position.vaultId}
                        href={`/vault/${position.vaultId}`}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            #{position.vaultId}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{getTokenSymbol(position.vaultId)}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <TrendingUp className="w-3 h-3 text-success" />
                              <span>{formatCurrency(parseFloat(position.supplied))}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {parseFloat(position.borrowed) > 0 && (
                            <div className="flex items-center gap-1 text-xs text-accent">
                              <TrendingDown className="w-3 h-3" />
                              <span>{formatCurrency(parseFloat(position.borrowed))}</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Not connected - Connect wallet prompt */}
          {!isConnected && (
            <div className="card-vault p-8 flex flex-col items-center justify-center relative z-10">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-center">
                {heroT("startInvesting") || "Start Investing"}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                {heroT("connectToEarn") || "Connect your wallet to supply assets and earn yields."}
              </p>
              <ConnectButton.Custom>
                {({ account, chain, openConnectModal, mounted }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  return (
                    <div className={!ready ? 'opacity-0 pointer-events-none' : 'relative z-20'}>
                      {!connected && (
                        <button
                          onClick={openConnectModal}
                          className="btn-primary text-sm relative z-30"
                        >
                          <Wallet className="w-4 h-4" />
                          {commonT("connectWallet")}
                        </button>
                      )}
                    </div>
                  );
                }}
              </ConnectButton.Custom>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
