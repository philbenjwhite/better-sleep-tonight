import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-open-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Better Sleep Tonight | Personalized Sleep Assessment & Mattress Recommendations",
  description: "Take our personalized sleep assessment to discover the perfect mattress for your needs. Get expert recommendations from Ashley, your AI sleep guide, and wake up feeling refreshed.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={openSans.variable}>
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-MQ5XK3D94V"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-MQ5XK3D94V');
          `}
        </Script>
      </head>
      <body className={openSans.className}>{children}</body>
    </html>
  );
}
