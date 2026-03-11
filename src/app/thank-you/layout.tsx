import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're All Set! | Better Sleep Tonight",
  description:
    "Your personalized mattress recommendation is ready. Visit a nearby store to experience your perfect Tempur-Pedic mattress in person.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ThankYouLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
