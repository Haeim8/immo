import { base, baseSepolia } from 'wagmi/chains';

export const APP_NAME = 'CANTORFI';
export const PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!PROJECT_ID) {
  throw new Error(
    "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID n'est pas défini dans .env.local"
  );
}

export const chains = [base, baseSepolia] as const;
