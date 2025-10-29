'use client';

import { FC, ReactNode, useState, useEffect } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, lightTheme, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { useTheme } from 'next-themes';
import '@rainbow-me/rainbowkit/styles.css';

const RainbowWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering theme-dependent content until mounted
  if (!mounted) {
    return (
      <RainbowKitProvider modalSize="compact">
        {children}
      </RainbowKitProvider>
    );
  }

  return (
    <RainbowKitProvider
      theme={theme === 'dark' || resolvedTheme === 'dark' ? darkTheme() : lightTheme()}
      modalSize="compact"
    >
      {children}
    </RainbowKitProvider>
  );
};

// Create minimal SSR config outside component to avoid recreating on each render
const ssrConfig = createConfig({
  chains: [baseSepolia],
  connectors: [],
  transports: {
    [baseSepolia.id]: http(),
  },
  ssr: true,
});

export const EVMWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<any>(ssrConfig);

  useEffect(() => {
    // Only initialize full Wagmi config on client-side to avoid indexedDB errors during SSR
    const { connectors } = getDefaultWallets({
      appName: 'USCI',
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
    });

    const wagmiConfig = createConfig({
      chains: [baseSepolia],
      connectors,
      transports: {
        [baseSepolia.id]: http(),
      },
      ssr: true,
      // CRITICAL: Disable auto-connect to prevent automatic wallet reconnection
      autoConnect: false,
    });

    setConfig(wagmiConfig);
    setMounted(true);
  }, []);

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <RainbowWrapper>{children}</RainbowWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
