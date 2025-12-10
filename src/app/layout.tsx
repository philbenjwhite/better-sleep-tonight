import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
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
      <body className={openSans.className}>{children}</body>
    </html>
  );
}
