import { EVMWalletProvider } from "@/components/wagmi-provider";
import { IntlProvider } from "@/components/providers/IntlProvider";
import { ToastProvider } from "@/components/ui/toast-notification";
import HeaderContent from "@/components/HeaderContent";
import FooterContent from "@/components/FooterContent";
import ErrorFilter from "@/components/ErrorFilter";
import GlobalBackground from "@/components/GlobalBackground";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <IntlProvider>
      <EVMWalletProvider>
        <ToastProvider>
        <ErrorFilter />

        {/* Background */}
        <div className="fixed inset-0 -z-20 bg-background" />

        {/* Main Frame - Morpho style */}
        <div
          className="fixed inset-x-0 top-0 flex flex-col p-0 md:p-3 lg:p-4 h-dvh"
          style={{ minHeight: '-webkit-fill-available' }}
        >
          <div className="relative flex-1 flex flex-col w-full h-full bg-card border-0 md:border border-border rounded-none md:rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl shadow-black/20">

            {/* Global Background - inside container */}
            <GlobalBackground />

            {/* Header - Fixed */}
            <header className="flex-shrink-0 z-50 w-full h-14 md:h-16 border-b border-border bg-card/80 backdrop-blur-xl">
              <HeaderContent />
            </header>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden custom-scrollbar">
              <div className="min-h-full flex flex-col">
                {children}
              </div>
            </main>

            {/* Footer - Hidden on mobile (shown in mobile nav drawer), visible on desktop */}
            <footer className="hidden md:block flex-shrink-0 w-full border-t border-border bg-card/50 py-2">
              <FooterContent />
            </footer>
          </div>
        </div>
        </ToastProvider>
      </EVMWalletProvider>
    </IntlProvider>
  );
}
