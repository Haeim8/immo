"use client";

import { motion } from "framer-motion";
import { ExternalLink, Coins, Landmark, Activity } from "lucide-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { BLOCK_EXPLORER_URL } from "@/lib/evm/hooks";

export default function HeroSection() {
  const { isConnected } = useAccount();
  
  return (
    <section className="relative w-full h-[85vh] md:h-[650px] mx-auto mt-4 mb-12 group overflow-hidden rounded-[32px] shadow-sm border
      /* COULEURS DE BASE */
      bg-white border-gray-200 
      dark:bg-[#050505] dark:border-white/10"
    >
      
      {/* --- FOND ANIMÉ "AURORA LIQUIDITY" (REMPLACE LA 3D) --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        
        {/* Orbe 1 : Cyan Liquide */}
        <motion.div 
          animate={{ 
            x: ["-20%", "20%", "-20%"],
            y: ["0%", "10%", "0%"], 
            scale: [1, 1.2, 1] 
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] opacity-40
            bg-cyan-300 mix-blend-multiply
            dark:bg-cyan-600 dark:mix-blend-screen"
        />

        {/* Orbe 2 : Violet Profond */}
        <motion.div 
          animate={{ 
            x: ["20%", "-20%", "20%"],
            y: ["0%", "-15%", "0%"],
            scale: [1.2, 1, 1.2]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-40
            bg-purple-300 mix-blend-multiply
            dark:bg-purple-800 dark:mix-blend-screen"
        />

        {/* Orbe 3 : Bleu Central */}
        <motion.div 
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full blur-[100px] opacity-30
            bg-blue-300 mix-blend-multiply
            dark:bg-blue-900 dark:mix-blend-screen"
        />

        {/* Texture de grain pour l'effet premium */}
        <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.03]" 
             style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
      </div>

      {/* --- CONTENU UI --- */}
      <div className="relative z-10 w-full h-full flex flex-col justify-center px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full items-center">
          
          {/* GAUCHE */}
          <div className="lg:col-span-7 flex flex-col justify-center pt-10 md:pt-0">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-6 w-fit
                bg-gray-100 text-gray-600 border border-gray-200
                dark:bg-white/5 dark:text-cyan-400 dark:border-white/10">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                RWA PROTOCOL LIVE
              </div>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight text-black dark:text-white">
                Assets <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">Liquified.</span>
              </h1>
              
              <p className="text-lg md:text-xl max-w-xl mb-8 leading-relaxed font-medium text-gray-600 dark:text-gray-300">
                Transformez vos actifs réels (Immobilier, Art, Luxe) en liquidité instantanée on-chain.
                <span className="text-black dark:text-white font-bold block mt-2"> Sécurisé. Audité. Automatisé.</span>
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <ConnectButton.Custom>
                  {({ account, chain, openConnectModal, mounted }) => {
                    const ready = mounted;
                    const connected = ready && account && chain;
                    return (
                      <div {...(!ready && { 'aria-hidden': true, 'style': { opacity: 0, pointerEvents: 'none' } })}>
                        {(() => {
                          if (!connected) {
                            return (
                              <button 
                                onClick={openConnectModal}
                                className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-transform hover:scale-105 shadow-lg
                                  bg-black text-white 
                                  dark:bg-cyan-500 dark:text-black dark:shadow-cyan-500/20"
                              >
                                <Coins className="w-5 h-5" />
                                Connect Wallet
                              </button>
                            );
                          }
                          return (
                            <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold cursor-default
                              bg-gray-100 text-gray-800 border border-gray-200
                              dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/50"
                            >
                              <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-cyan-400 animate-pulse" />
                              Wallet Connected
                            </button>
                          );
                        })()}
                      </div>
                    );
                  }}
                </ConnectButton.Custom>

                <a 
                  href={BLOCK_EXPLORER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-colors border
                    bg-white text-black border-gray-300 hover:bg-gray-50
                    dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10"
                >
                  <ExternalLink className="w-4 h-4" />
                  Contracts
                </a>
              </div>
            </motion.div>
          </div>

          {/* DROITE : Data Cards (Flottantes) */}
          <div className="lg:col-span-5 h-full flex flex-col justify-center lg:items-end pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full max-w-[340px] space-y-5 pointer-events-auto"
            >
              
              {/* Carte Liquidity */}
              <div className="p-6 rounded-2xl shadow-xl border backdrop-blur-md
                bg-white/80 border-gray-200
                dark:bg-[#1a1a1a]/80 dark:border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <Landmark className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Total Liquidity
                  </div>
                  <span className="text-cyan-600 dark:text-cyan-400 font-mono font-bold">+12%</span>
                </div>
                <div className="text-4xl font-mono font-bold mb-3 text-black dark:text-white">
                  $12.45M
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-white/10">
                  <div className="h-full bg-cyan-500 w-[65%]" />
                </div>
                <div className="flex justify-between mt-3 text-xs text-gray-500">
                  <span>Cap: $20M</span>
                  <span>65% Filled</span>
                </div>
              </div>

              {/* Carte Loans */}
              <div className="p-6 rounded-2xl shadow-xl border backdrop-blur-md
                bg-white/80 border-gray-200
                dark:bg-[#1a1a1a]/80 dark:border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Active Loans
                  </div>
                </div>
                <div className="text-4xl font-mono font-bold mb-3 text-black dark:text-white">
                  $8.2M
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-white/10">
                  <div className="h-full bg-purple-600 dark:bg-purple-500 w-[10%]" />
                </div>
                <div className="flex justify-between mt-3 text-xs text-gray-500">
                  <span>Collateralized</span>
                  <span>40% Utilized</span>
                </div>
              </div>

            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}