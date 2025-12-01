"use client"

import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useRouter } from "next/navigation"

const ADMIN_ADDRESSES = [
  "0x222fD66bbfc6808e123aB51f5FB21644731dFDE2",
].map(addr => addr.toLowerCase())

export default function Home() {
  const { isConnected, address } = useAccount()
  const router = useRouter()

  const isAdmin = address && ADMIN_ADDRESSES.includes(address.toLowerCase())

  const handleEnterDashboard = () => {
    if (isConnected && isAdmin) {
      router.push("/dashboard")
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0f]">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px'
        }}
      />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[128px]" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-semibold tracking-tight text-white/95">
            CantorFi
          </h1>
          <p className="text-[13px] text-white/40 mt-1 font-medium tracking-wide uppercase">
            Protocol Administration
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl p-6">
          <div className="space-y-6">
            {/* Network indicator */}
            <div className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[12px] text-white/50 font-medium">Base Sepolia</span>
            </div>

            {/* Connect section */}
            <div className="flex flex-col items-center gap-4">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const connected = mounted && account && chain

                  return (
                    <div className="w-full">
                      {!connected ? (
                        <button
                          onClick={openConnectModal}
                          className="w-full h-11 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] text-[13px] font-medium text-white/85 transition-colors"
                        >
                          Connect Wallet
                        </button>
                      ) : (
                        <button
                          onClick={openAccountModal}
                          className="w-full h-11 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[13px] font-medium text-white/75 transition-colors flex items-center justify-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {account.displayName}
                        </button>
                      )}
                    </div>
                  )
                }}
              </ConnectButton.Custom>

              {/* Status messages */}
              {isConnected && !isAdmin && (
                <p className="text-[13px] text-red-400/80">
                  Wallet not authorized
                </p>
              )}

              {/* Enter button */}
              {isConnected && isAdmin && (
                <button
                  onClick={handleEnterDashboard}
                  className="w-full h-11 rounded-lg bg-white/90 hover:bg-white text-[13px] font-medium text-[#0a0a0f] transition-colors"
                >
                  Enter Dashboard
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-white/25 mt-6">
          Restricted access
        </p>
      </div>
    </div>
  )
}
