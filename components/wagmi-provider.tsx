'use client';

import { FC, ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider, http, createStorage, cookieStorage } from 'wagmi';
import { APP_NAME, PROJECT_ID, chains } from '@/lib/wagmi-config';
import { baseSepolia, base } from 'wagmi/chains';

// Singleton pour éviter la réinitialisation multiple
let wagmiConfig: ReturnType<typeof getDefaultConfig> | null = null;

function getWagmiConfig() {
  if (!wagmiConfig) {
    wagmiConfig = getDefaultConfig({
      appName: APP_NAME,
      projectId: PROJECT_ID!,
      chains,
      ssr: true,
      storage: createStorage({
        storage: cookieStorage,
      }),
      transports: {
        [base.id]: http('https://mainnet.base.org'),
        [baseSepolia.id]: http('https://sepolia.base.org'),
      },
    });
  }
  return wagmiConfig;
}

const RainbowWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <RainbowKitProvider
      chains={chains}
      initialChain={baseSepolia}
      modalSize="compact"
      appInfo={{
        appName: APP_NAME,
        disclaimer: undefined,
      }}
    >
      {children}
    </RainbowKitProvider>
  );
};

export const EVMWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <WagmiProvider config={getWagmiConfig()}>
      <QueryClientProvider client={queryClient}>
        <RainbowWrapper>{children}</RainbowWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
