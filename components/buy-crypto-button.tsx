'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { CreditCard, Loader2 } from 'lucide-react';
import { useTranslations } from '@/components/providers/IntlProvider';

interface BuyCryptoButtonProps {
  className?: string;
}

export function BuyCryptoButton({ className }: BuyCryptoButtonProps) {
  const { address, isConnected } = useAccount();
  const t = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);

  const handleBuy = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/onramp/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: isConnected ? address : undefined,
          blockchains: ['base'],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to get session token:', error);
        alert('Erreur lors de la connexion au service d\'achat');
        return;
      }

      const { token } = await response.json();

      // Open Coinbase Pay with session token
      const url = `https://pay.coinbase.com/buy/select-asset?sessionToken=${token}&defaultNetwork=base&defaultAsset=USDC`;
      window.open(url, '_blank', 'width=500,height=700');

    } catch (error) {
      console.error('Error opening onramp:', error);
      alert('Erreur lors de l\'ouverture du service d\'achat');
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
