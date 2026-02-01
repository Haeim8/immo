'use client';

import { FC, ReactNode, useState, useEffect, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider, createStorage, cookieStorage } from 'wagmi';
import { APP_NAME, PROJECT_ID, chains } from '@/lib/wagmi-config';
import { baseSepolia } from 'wagmi/chains';

const config = getDefaultConfig({
  appName: APP_NAME,
  projectId: PROJECT_ID!,
  chains,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

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
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider
          chain={baseSepolia}
          apiKey={process.env.NEXT_PUBLIC_COINBASE_CDP_API_KEY}
        >
          <RainbowWrapper>{children}</RainbowWrapper>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
