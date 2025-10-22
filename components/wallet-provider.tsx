'use client';

import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

export const SolanaWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Use devnet
  const network = WalletAdapterNetwork.Devnet;

  // You can also use a custom RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // Configure wallets including mobile support
  const wallets = useMemo(
    () => [
      // Mobile Wallet Adapter for deep links (must be first for mobile)
      new SolanaMobileWalletAdapter({
        appIdentity: {
          name: 'USCI',
          uri: typeof window !== 'undefined' ? window.location.origin : '',
          icon: typeof window !== 'undefined' ? `${window.location.origin}/logo-dark.svg` : '',
        },
        authorizationResultCache: {
          get: async () => {
            try {
              const cached = localStorage.getItem('solanaMobileWalletAuth');
              return cached ? JSON.parse(cached) : undefined;
            } catch {
              return undefined;
            }
          },
          set: async (value) => {
            try {
              localStorage.setItem('solanaMobileWalletAuth', JSON.stringify(value));
            } catch {
              // Ignore
            }
          },
          clear: async () => {
            try {
              localStorage.removeItem('solanaMobileWalletAuth');
            } catch {
              // Ignore
            }
          },
        },
        cluster: network,
      }),
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};
