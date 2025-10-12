"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, TrendingUp, ExternalLink, Calendar, Home } from "lucide-react";
import { Investment } from "@/lib/mock-data";
import GlassCard from "@/components/atoms/GlassCard";
import AnimatedButton from "@/components/atoms/AnimatedButton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PropertyCardProps {
  investment: Investment;
}

export default function PropertyCard({ investment }: PropertyCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -8 }}
      >
        <div className="group relative overflow-hidden rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer"
             onClick={() => setIsOpen(true)}>
          {/* Image */}
          <div className="relative h-56 w-full overflow-hidden">
            <Image
              src={investment.imageUrl}
              alt={investment.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Funding Progress Badge */}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-cyan-500/90 backdrop-blur-sm text-white text-sm font-semibold">
              {investment.fundingProgress}% Funded
            </div>

            {/* Location */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
              <MapPin className="h-4 w-4" />
              <span className="text-sm font-medium">
                {investment.location.city}, {investment.location.province}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div>
              <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-cyan-400 transition-colors">
                {investment.name}
              </h3>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                  ${investment.priceUSD.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. Value</span>
                <span className="font-semibold">${investment.estimatedValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expected Return</span>
                <span className="font-semibold text-green-400">{investment.expectedReturn}% /year</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-semibold">{investment.type}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${investment.fundingProgress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Hover Glow Effect */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </motion.div>

      {/* Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-2xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
                {investment.name}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Image */}
            <div className="relative h-80 w-full overflow-hidden rounded-2xl">
              <Image
                src={investment.imageUrl}
                alt={investment.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cyan-400" />
                Description
              </h3>
              <p className="text-muted-foreground">{investment.description}</p>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <GlassCard className="p-4">
                <Home className="h-5 w-5 text-cyan-400 mb-2" />
                <p className="text-xs text-muted-foreground">Surface</p>
                <p className="text-2xl font-bold">{investment.surface}m²</p>
              </GlassCard>
              <GlassCard className="p-4">
                <TrendingUp className="h-5 w-5 text-green-400 mb-2" />
                <p className="text-xs text-muted-foreground">Return</p>
                <p className="text-2xl font-bold">{investment.expectedReturn}%</p>
              </GlassCard>
              <GlassCard className="p-4">
                <Calendar className="h-5 w-5 text-blue-400 mb-2" />
                <p className="text-xs text-muted-foreground">Built</p>
                <p className="text-2xl font-bold">{investment.details.yearBuilt}</p>
              </GlassCard>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Features</h3>
              <div className="flex flex-wrap gap-2">
                {investment.details.features.map((feature, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Contract */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold mb-1">Smart Contract</h3>
                  <code className="text-xs text-muted-foreground">{investment.contractAddress}</code>
                </div>
                <AnimatedButton
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://etherscan.io/address/${investment.contractAddress}`, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </AnimatedButton>
              </div>
            </GlassCard>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <AnimatedButton variant="primary" size="lg" className="flex-1">
                Invest Now
              </AnimatedButton>
              <AnimatedButton variant="outline" size="lg">
                Download Contract
              </AnimatedButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
