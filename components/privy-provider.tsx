'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ReactNode } from 'react';

export function AppPrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is not defined in environment variables');
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#06b6d4',
        },
        loginMethods: ['email', 'wallet'],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: {
          id: 103, // Solana devnet
          name: 'Solana Devnet',
          network: 'devnet',
          nativeCurrency: {
            name: 'SOL',
            symbol: 'SOL',
            decimals: 9,
          },
          rpcUrls: {
            default: {
              http: ['https://api.devnet.solana.com'],
            },
          },
        },
        supportedChains: [
          {
            id: 103,
            name: 'Solana Devnet',
            network: 'devnet',
            nativeCurrency: {
              name: 'SOL',
              symbol: 'SOL',
              decimals: 9,
            },
            rpcUrls: {
              default: {
                http: ['https://api.devnet.solana.com'],
              },
            },
          },
          {
            id: 101,
            name: 'Solana Mainnet',
            network: 'mainnet-beta',
            nativeCurrency: {
              name: 'SOL',
              symbol: 'SOL',
              decimals: 9,
            },
            rpcUrls: {
              default: {
                http: ['https://api.mainnet-beta.solana.com'],
              },
            },
          },
        ],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
