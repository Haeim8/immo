'use client';

import { useState } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { CreditCard, Loader2 } from 'lucide-react';
import { useTranslations } from '@/components/providers/IntlProvider';

interface BuyCryptoButtonProps {
  className?: string;
}

export function BuyCryptoButton({ className }: BuyCryptoButtonProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const t = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);

  const handleBuy = async () => {
    if (!isConnected || !address) {
      alert("Veuillez connecter votre wallet");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Sign message for authentication
      const timestamp = Date.now().toString();
      const message = `CantorFi Onramp Session Request\nNonce: ${timestamp}`;

      const signature = await signMessageAsync({ message, account: address });

      // 2. Call API with signature
      const response = await fetch('/api/onramp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address,
          blockchains: ['base'],
          signature,
          timestamp,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to get session token:', error);
        alert(error.error || 'Erreur lors de la connexion au service d\'achat');
        return;
      }

      const { token } = await response.json();

      // Open Coinbase Pay with session token
      const url = `https://pay.coinbase.com/buy/select-asset?sessionToken=${token}&defaultNetwork=base&defaultAsset=USDC`;
      window.open(url, '_blank', 'width=500,height=700');

    } catch (error) {
      console.error('Error opening onramp:', error);
      // alert('Erreur lors de l\'ouverture du service d\'achat');
      // User might have rejected signature
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleBuy}
      disabled={isLoading}
      className={`btn-primary text-sm ${className || ''}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4" />
      )}
      <span>{t('buy') || 'Buy'}</span>
    </button>
  );
}
