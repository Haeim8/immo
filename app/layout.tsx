import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppPrivyProvider } from "@/components/privy-provider";
import { SolanaWalletProvider } from "@/components/wallet-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "USCI - Tokenized Real Estate Investment",
  description: "Blockchain-powered real estate investment platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppPrivyProvider>
            <SolanaWalletProvider>
              {children}
            </SolanaWalletProvider>
          </AppPrivyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
