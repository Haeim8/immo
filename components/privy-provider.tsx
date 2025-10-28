'use client';

import { FC, ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { createConfig, WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

const wagmiConfig = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(),
  },
  ssr: true,
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000,
    },
  },
});

export const EVMWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

  if (!appId) {
    console.error('NEXT_PUBLIC_PRIVY_APP_ID manquant');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        {appId ? (
          <PrivyProvider
            appId={appId}
            config={{
              appearance: {
                theme: 'dark',
                accentColor: '#667eea',
              },
              loginMethods: ['wallet'],
              supportedChains: [baseSepolia],
              defaultChain: baseSepolia,
            }}
          >
            {children}
          </PrivyProvider>
        ) : (
          children
        )}
      </WagmiProvider>
    </QueryClientProvider>
  );
};
