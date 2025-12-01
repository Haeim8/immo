"use client"

import Image from "next/image"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center border-b border-white/[0.06] bg-background/95 backdrop-blur-sm">
      <div className="flex w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <span className="text-sm font-medium text-foreground/90">Dashboard</span>
        <span className="ml-2 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
          Base Sepolia
        </span>

        <div className="ml-auto">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const connected = mounted && account && chain

              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="h-9 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-[13px] font-medium text-foreground/80 transition-colors"
                  >
                    Connect
                  </button>
                )
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    className="h-9 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[13px] font-medium text-foreground/70 transition-colors flex items-center gap-2"
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <Image
                        src={chain.iconUrl}
                        alt={chain.name ?? "Chain"}
                        width={16}
                        height={16}
                        className="rounded-full"
                        unoptimized
                      />
                    )}
                  </button>
                  <button
                    onClick={openAccountModal}
                    className="h-9 px-3 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[13px] font-medium text-foreground/80 transition-colors"
                  >
                    {account.displayName}
                  </button>
                </div>
              )
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  )
}
