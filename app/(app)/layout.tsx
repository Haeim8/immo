import { EVMWalletProvider } from "@/components/wagmi-provider";
import { IntlProvider } from "@/components/providers/IntlProvider";
import HeaderContent from "@/components/HeaderContent";
import FooterContent from "@/components/FooterContent";
import ErrorFilter from "@/components/ErrorFilter";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <IntlProvider>
      <EVMWalletProvider>
        <ErrorFilter />
        <div className="fixed inset-0 bg-background border-0 md:border-[10px] border-background rounded-none md:rounded-[30px] flex flex-col m-0 md:m-[10px]">
          <header className="bg-background flex-shrink-0 z-40 w-full flex items-center h-[50px] md:h-[65px] pt-safe">
            <HeaderContent />
          </header>
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide rounded-none md:rounded-tl-[15px] md:rounded-tr-[15px] md:rounded-bl-[15px] md:rounded-br-[15px] md:pb-0" style={{ backgroundColor: 'hsl(var(--muted) / 0.6)' }}>
            {children}
          </div>
          <footer className="hidden md:block bg-background flex-shrink-0 w-full px-6 py-3">
            <FooterContent />
          </footer>
        </div>
      </EVMWalletProvider>
    </IntlProvider>
  );
}
