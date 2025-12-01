import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { baseSepolia } from "wagmi/chains";

// Same RPC and keys as client app for consistency
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "a20a2477498493f04f0178a8c25ca9fc";
const ALCHEMY_RPC = process.env.NEXT_PUBLIC_RPC_URL_ALCHEMY || "https://base-sepolia.g.alchemy.com/v2/Ml_LGMhgsfi4FzoGwfQlK";

export const config = getDefaultConfig({
  appName: "CantorFi Admin",
  projectId: WALLETCONNECT_PROJECT_ID,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http(ALCHEMY_RPC),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
