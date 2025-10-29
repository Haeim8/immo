'use client';

import { FC, ReactNode, useMemo, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { useTheme } from 'next-themes';
import { WagmiProvider, http, createStorage, cookieStorage } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

const APP_NAME = 'USCI';
const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const FALLBACK_PROJECT_ID = '21fef48091f12692cad574a6f7753643';

if (!PROJECT_ID) {
  console.warn(
    'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID n’est pas défini. WalletConnect utilisera un identifiant de secours – pensez à configurer votre propre clé.'
  );
}

const chains = [base, baseSepolia] as const;

const wagmiConfig = getDefaultConfig({
  appName: APP_NAME,
  projectId: PROJECT_ID ?? FALLBACK_PROJECT_ID,
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

const RainbowWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <RainbowKitProvider chains={chains} initialChain={baseSepolia} modalSize="compact">
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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowWrapper>{children}</RainbowWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
