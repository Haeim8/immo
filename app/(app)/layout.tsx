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
        
        {/* FOND DE PAGE SIMPLE : Gris très clair (Light) / Noir (Dark) */}
        <div className="fixed inset-0 -z-20 bg-gray-50 dark:bg-black transition-colors duration-300" />

        {/* CADRE PRINCIPAL */}
        <div className="fixed inset-0 flex flex-col p-0 md:p-3 lg:p-4 transition-all duration-300">
          <div className="relative flex-1 flex flex-col w-full h-full
            /* COULEUR DE FOND DU CADRE : Blanc pur (Light) / Noir légèrement plus clair (Dark) */
            bg-white dark:bg-[#0a0a0a]
            
            /* BORDURES */
            border-0 md:border border-gray-200 dark:border-white/10
            
            /* ARRONDIS ET OMBRES SIMPLES */
            rounded-none md:rounded-[30px] 
            shadow-xl dark:shadow-none
            overflow-hidden">
            
            {/* Header */}
            <header className="flex-shrink-0 z-50 w-full h-16 md:h-20 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#0a0a0a]">
              <HeaderContent />
            </header>

            {/* Contenu Principal */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden custom-scrollbar bg-white dark:bg-[#0a0a0a]">
              <div className="min-h-full flex flex-col relative z-10 text-black dark:text-white">
                 {children}
              </div>
            </main>

            {/* Footer */}
            <footer className="flex-shrink-0 w-full border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#0a0a0a] py-2">
              <FooterContent />
            </footer>
          </div>
        </div>
      </EVMWalletProvider>
    </IntlProvider>
  );
}