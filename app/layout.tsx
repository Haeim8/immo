import type { Metadata, Viewport } from "next";
import { Tomorrow } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import JsonLd from "@/components/JsonLd";

export const dynamic = 'force-dynamic';

const tomorrow = Tomorrow({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "CANTORFI - Tokenized Claims & Real Assets",
    template: "%s | CANTORFI",
  },
  description: "RWA Multi Blockchain-powered",
  keywords: ["CANTORFI", "RWA", "tokenization", "blockchain", "real assets", "crypto", "Base", "Ethereum"],
  authors: [{ name: "CANTORFI" }],
  creator: "CANTORFI",
  publisher: "CANTORFI",
  metadataBase: new URL("https://cantorfi.tech"),
  alternates: {
    canonical: "https://cantorfi.tech",
    languages: {
      "en": "https://cantorfi.tech",
      "fr": "https://cantorfi.ca",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cantorfi.tech",
    siteName: "CANTORFI",
    title: "CANTORFI - Tokenized Claims & Real Assets",
    description: "RWA Multi Blockchain-powered",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "CANTORFI - Tokenized Real Assets",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CANTORFI - Tokenized Claims & Real Assets",
    description: "RWA Multi Blockchain-powered",
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <JsonLd />
      </head>
      <body className={tomorrow.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
