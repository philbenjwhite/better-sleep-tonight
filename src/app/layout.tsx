import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { AnalyticsScripts } from "@/components/Analytics";
import { Providers } from "./providers";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Better Sleep Tonight | Personalized Sleep Assessment & Mattress Recommendations",
  description: "Take our personalized sleep assessment to discover the perfect mattress for your needs. Get expert recommendations from Ashley, your AI sleep guide.",
  metadataBase: new URL("https://www.bettersleeptonight.com"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon_16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon_32.png", sizes: "32x32", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={openSans.variable}>
      <head>
        {/* GTM, GA4 and Hotjar. Production hosts only, see AnalyticsScripts. */}
        <AnalyticsScripts />
      </head>
      <body className={openSans.className}>
        {/* Skip to main content link for keyboard users */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-NFXLP675"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
