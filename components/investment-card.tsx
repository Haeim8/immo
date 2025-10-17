"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Investment } from "@/lib/mock-data";
import { MapPin, TrendingUp, Home, ExternalLink, Calendar } from "lucide-react";
import Image from "next/image";
import { getIpfsUrl } from "@/lib/pinata/upload";

interface InvestmentCardProps {
  investment: Investment;
}

export default function InvestmentCard({ investment }: InvestmentCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Get image URL from IPFS if imageCid exists, otherwise use imageUrl
  const displayImageUrl = investment.imageCid
    ? getIpfsUrl(investment.imageCid)
    : investment.imageUrl || "/placeholder-property.jpg";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Card className="overflow-hidden hover:shadow-xl transition-shadow border-2 hover:border-turquoise-500/50">
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={displayImageUrl}
            alt={investment.name}
            fill
            className="object-cover"
          />
          <div className="absolute top-2 right-2 bg-turquoise-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {investment.fundingProgress}% Financé
          </div>
        </div>

        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {investment.name}
            <span className="text-turquoise-500 text-lg">
              ${investment.priceUSD.toLocaleString()}
            </span>
          </CardTitle>
          <CardDescription className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {investment.location.city}, {investment.location.province}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Valeur estimée</span>
            <span className="font-semibold">
              ${investment.estimatedValue.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rendement attendu</span>
            <span className="font-semibold text-emerald-500">
              {investment.expectedReturn}% /an
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Type</span>
            <span className="font-semibold">{investment.type}</span>
          </div>
        </CardContent>

        <CardFooter>
          <DialogTrigger asChild>
            <Button className="w-full" variant="default">
              Voir Plus
            </Button>
          </DialogTrigger>
        </CardFooter>
      </Card>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{investment.name}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            {investment.location.city}, {investment.location.province}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image */}
          <div className="relative h-64 w-full overflow-hidden rounded-lg">
            <Image
              src={displayImageUrl}
              alt={investment.name}
              fill
              className="object-cover"
            />
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{investment.description}</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Home className="h-4 w-4 text-turquoise-500" />
                <span className="text-sm text-muted-foreground">Surface</span>
              </div>
              <p className="text-xl font-bold">{investment.surface}m²</p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                <span className="text-sm text-muted-foreground">Rendement</span>
              </div>
              <p className="text-xl font-bold">{investment.expectedReturn}%</p>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">Construction</span>
              </div>
              <p className="text-xl font-bold">{investment.details.yearBuilt}</p>
            </div>
          </div>

          {/* Details */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Détails</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Prix:</span>
                <span className="ml-2 font-semibold">
                  ${investment.priceUSD.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Valeur estimée:</span>
                <span className="ml-2 font-semibold">
                  ${investment.estimatedValue.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Chambres:</span>
                <span className="ml-2 font-semibold">
                  {investment.details.rooms}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <span className="ml-2 font-semibold">{investment.type}</span>
              </div>
            </div>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Équipements</h3>
            <div className="flex flex-wrap gap-2">
              {investment.details.features.map((feature, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-turquoise-500/10 text-turquoise-600 dark:text-turquoise-400 rounded-full text-sm"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Contract Address */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Contrat Blockchain</h3>
            <div className="flex items-center justify-between">
              <code className="text-xs text-muted-foreground break-all">
                {investment.contractAddress}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  window.open(
                    `https://etherscan.io/address/${investment.contractAddress}`,
                    "_blank"
                  )
                }
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button className="flex-1" size="lg">
              Investir Maintenant
            </Button>
            <Button variant="outline" size="lg">
              Télécharger Contrat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
