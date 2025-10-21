import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppPrivyProvider } from "@/components/privy-provider";
import { SolanaWalletProvider } from "@/components/wallet-provider";
import MobileNav from "@/components/organisms/MobileNav";
import { IntlProvider } from "@/components/providers/IntlProvider";
import HeaderContent from "@/components/HeaderContent";
import FooterContent from "@/components/FooterContent";

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
        <IntlProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AppPrivyProvider>
              <SolanaWalletProvider>
                <div className="fixed inset-0 border-[10px] border-background rounded-[30px] overflow-hidden flex flex-col" style={{ margin: '10px' }}>
                  <header className="bg-background flex-shrink-0 z-40 w-full flex items-center" style={{ height: '80px' }}>
                    <HeaderContent />
                  </header>
                  <div className="flex-1 overflow-y-auto scrollbar-hide rounded-tl-[15px] rounded-tr-[15px] rounded-bl-[15px] rounded-br-[15px]" style={{ backgroundColor: 'hsl(var(--muted) / 0.6)' }}>
                    {children}
                  </div>
                  <footer className="bg-background flex-shrink-0 w-full px-6 py-5">
                    <FooterContent />
                  </footer>
                  <MobileNav />
                </div>
              </SolanaWalletProvider>
            </AppPrivyProvider>
          </ThemeProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
