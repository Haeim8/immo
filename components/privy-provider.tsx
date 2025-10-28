'use client';

import { FC, ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { baseSepolia } from 'viem/chains';

export const EVMWalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

  if (!appId) {
    console.error('NEXT_PUBLIC_PRIVY_APP_ID manquant');
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: 'dark',
          accentColor: '#667eea',
        },
        loginMethods: ['wallet', 'email'],
        supportedChains: [baseSepolia],
        defaultChain: baseSepolia,
      }}
    >
      {children}
    </PrivyProvider>
  );
};
