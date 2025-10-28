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
  autoConnect: true,
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}

const queryClient = new QueryClient();

export const EVMWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#667eea',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        loginMethods: ['email', 'wallet'],
        supportedChains: [baseSepolia],
        defaultChain: baseSepolia,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
};
